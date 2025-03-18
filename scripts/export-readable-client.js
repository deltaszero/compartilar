#!/usr/bin/env node

/**
 * Human-readable Firestore export script for CompartiLar using client-side SDK
 * 
 * This script connects to Firestore using the client-side SDK and exports data
 * in a clean, human-readable JSON format.
 * 
 * Usage:
 * node export-readable-client.js [--collection=collectionName] [--output=outputPath]
 * 
 * Options:
 * --collection: Specific collection to export (default: export all collections)
 * --output: Output file path (default: "./firestore-export-{timestamp}.json")
 * --pretty: Format JSON with indentation (default: true)
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  where,
  limit,
  orderBy
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Parse command line arguments
const args = process.argv.slice(2);
let collectionName = null;
let outputPath = null;
let pretty = true;
let email = null;
let password = null;

for (const arg of args) {
  if (arg.startsWith('--collection=')) {
    collectionName = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputPath = arg.split('=')[1];
  } else if (arg === '--no-pretty') {
    pretty = false;
  } else if (arg.startsWith('--email=')) {
    email = arg.split('=')[1];
  } else if (arg.startsWith('--password=')) {
    password = arg.split('=')[1];
  } else if (arg.startsWith('--help') || arg === '-h') {
    console.log(`
Human-readable Firestore export script for CompartiLar

Usage:
node export-readable-client.js [--collection=collectionName] [--output=outputPath] [--email=user@example.com] [--password=yourpassword] [--no-pretty]

Options:
--collection=name   : Only export the specified collection
--output=path       : Output file path (default: "./firestore-export-{timestamp}.json")
--email=email       : Firebase authentication email
--password=password : Firebase authentication password
--no-pretty         : Don't format JSON with indentation
--help, -h          : Show this help message
    `);
    process.exit(0);
  }
}

// Generate default output path if not provided
if (!outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  outputPath = `./firestore-export-${timestamp}.json`;
}

// Firebase configuration - get from environment variables or use default for CompartiLar
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCv7XMD3OT4hRG0-V5uT2FIVoO8hc0uGLQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "compartilar-firebase-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "compartilar-firebase-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "compartilar-firebase-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "553179892493",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:553179892493:web:6b9249dc40dd90c9ff1e5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log(`Connected to Firebase project: ${firebaseConfig.projectId}`);

// Function to convert Firestore timestamps to ISO strings
function convertTimestamps(data) {
  if (!data) return data;
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (typeof data === 'object' && data.hasOwnProperty('seconds') && data.hasOwnProperty('nanoseconds')) {
    // This is likely a Firestore Timestamp
    const date = new Date(data.seconds * 1000 + data.nanoseconds / 1000000);
    return date.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = convertTimestamps(value);
    }
    return result;
  }
  
  return data;
}

// Function to fetch a maximum number of documents from a collection
async function getCollectionDocs(collectionRef, maxDocs = 1000) {
  const snapshot = await getDocs(collectionRef);
  
  const result = {};
  
  let count = 0;
  for (const doc of snapshot.docs) {
    if (count >= maxDocs) {
      console.log(`Reached maximum document limit (${maxDocs}) for collection ${collectionRef.path}`);
      break;
    }
    
    // Get document data and convert timestamps
    const docData = convertTimestamps(doc.data());
    
    // Add document to result
    result[doc.id] = docData;
    count++;
  }
  
  return { data: result, total: snapshot.size, fetched: count };
}

// Function to fetch subcollections for a document
async function getDocumentSubcollections(docRef, maxDepth = 2, currentDepth = 1) {
  if (currentDepth > maxDepth) {
    return {};
  }
  
  try {
    // In client SDK, we need to list subcollections one by one
    // This is a common pattern for common subcollections
    const commonSubcollections = [
      'events', 
      'change_history', 
      'notifications', 
      'friends', 
      'friendship_requests'
    ];
    
    const result = {};
    
    for (const subcollName of commonSubcollections) {
      try {
        const subcollRef = collection(docRef, subcollName);
        const subcollResult = await getCollectionDocs(subcollRef, 100);
        
        if (Object.keys(subcollResult.data).length > 0) {
          console.log(`Found subcollection ${subcollName} with ${subcollResult.fetched}/${subcollResult.total} docs`);
          result[subcollName] = subcollResult.data;
          
          // Recursively get subcollections of documents in this subcollection
          if (currentDepth < maxDepth) {
            for (const [subdocId, _] of Object.entries(subcollResult.data)) {
              const subdocRef = doc(subcollRef, subdocId);
              const subsubcollections = await getDocumentSubcollections(
                subdocRef, 
                maxDepth, 
                currentDepth + 1
              );
              
              if (Object.keys(subsubcollections).length > 0) {
                result[subcollName][subdocId]['_subcollections'] = subsubcollections;
              }
            }
          }
        }
      } catch (error) {
        // Just ignore errors for subcollections that don't exist
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting subcollections:`, error);
    return {};
  }
}

// Main function to export data
async function exportData() {
  console.log('Starting Firestore export in human-readable format...');
  
  try {
    // Initialize Firebase authentication if credentials provided
    if (email && password) {
      console.log(`Authenticating with Firebase as ${email}...`);
      const auth = getAuth(app);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Authentication successful. Logged in as ${userCredential.user.email}`);
      } catch (authError) {
        console.error('Authentication failed:', authError.message);
        process.exit(1);
      }
    } else {
      console.log('No authentication credentials provided. Attempting to read with default permissions...');
    }
    
    const result = {};
    
    if (collectionName) {
      // Export a specific collection
      console.log(`Exporting collection: ${collectionName}`);
      const collectionRef = collection(db, collectionName);
      const collectionResult = await getCollectionDocs(collectionRef);
      result[collectionName] = collectionResult.data;
      
      console.log(`Fetched ${collectionResult.fetched}/${collectionResult.total} documents from ${collectionName}`);
      
      // Get subcollections for each document
      console.log(`Checking for subcollections in ${collectionName}...`);
      for (const [docId, _] of Object.entries(collectionResult.data)) {
        const docRef = doc(db, collectionName, docId);
        const subcollections = await getDocumentSubcollections(docRef);
        
        if (Object.keys(subcollections).length > 0) {
          result[collectionName][docId]['_subcollections'] = subcollections;
        }
      }
    } else {
      // Export all collections (that we know about)
      console.log('Exporting collections...');
      
      // List of collections to export
      const collectionsToExport = [
        'children',
        'users',
        'child_guardians',
        'notifications',
        'system_backups',
        'system_restores'
      ];
      
      for (const collName of collectionsToExport) {
        try {
          console.log(`Exporting collection: ${collName}`);
          const collRef = collection(db, collName);
          const collResult = await getCollectionDocs(collRef);
          
          if (Object.keys(collResult.data).length > 0) {
            result[collName] = collResult.data;
            console.log(`Fetched ${collResult.fetched}/${collResult.total} documents from ${collName}`);
            
            // Get subcollections for each document
            console.log(`Checking for subcollections in ${collName}...`);
            for (const [docId, _] of Object.entries(collResult.data)) {
              const docRef = doc(db, collName, docId);
              const subcollections = await getDocumentSubcollections(docRef);
              
              if (Object.keys(subcollections).length > 0) {
                result[collName][docId]['_subcollections'] = subcollections;
              }
            }
          } else {
            console.log(`No documents found in collection ${collName}`);
          }
        } catch (error) {
          console.error(`Error exporting collection ${collName}:`, error);
        }
      }
    }
    
    // Write the result to file
    const jsonData = pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
    fs.writeFileSync(outputPath, jsonData, 'utf8');
    
    console.log(`Export completed successfully!`);
    console.log(`Output file: ${path.resolve(outputPath)}`);
    console.log(`Exported collections: ${Object.keys(result).join(', ')}`);
    
    // Print file stats
    const stats = fs.statSync(outputPath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });