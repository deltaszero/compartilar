#!/usr/bin/env node

/**
 * Human-readable Firestore export script for CompartiLar
 * 
 * This script connects directly to Firestore and exports data in a clean,
 * human-readable JSON format.
 * 
 * Usage:
 * node export-readable.js [--collection=collectionName] [--output=outputPath]
 * 
 * Options:
 * --collection: Specific collection to export (default: export all collections)
 * --output: Output file path (default: "./firestore-export-{timestamp}.json")
 * --pretty: Format JSON with indentation (default: true)
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Parse command line arguments
const args = process.argv.slice(2);
let collectionName = null;
let outputPath = null;
let pretty = true;

for (const arg of args) {
  if (arg.startsWith('--collection=')) {
    collectionName = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputPath = arg.split('=')[1];
  } else if (arg === '--no-pretty') {
    pretty = false;
  } else if (arg.startsWith('--help') || arg === '-h') {
    console.log(`
Human-readable Firestore export script for CompartiLar

Usage:
node export-readable.js [--collection=collectionName] [--output=outputPath] [--no-pretty]

Options:
--collection=name   : Only export the specified collection
--output=path       : Output file path (default: "./firestore-export-{timestamp}.json")
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

// Initialize Firebase Admin SDK using environment variables or project ID
try {
  // Get project details from the firebase configuration
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'compartilar-firebase-app';
  
  // Use application default credentials (works with Firebase CLI login)
  const app = initializeApp({
    projectId
  });
  
  console.log(`Connected to Firebase project: ${projectId}`);
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('Make sure you are logged in to Firebase CLI with: firebase login');
  process.exit(1);
}

const db = getFirestore();

// Function to convert Firestore timestamps to ISO strings
function convertTimestamps(data) {
  if (!data) return data;
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (typeof data === 'object' && data.hasOwnProperty('_seconds') && data.hasOwnProperty('_nanoseconds')) {
    // This is likely a Firestore Timestamp
    const date = new Date(data._seconds * 1000 + data._nanoseconds / 1000000);
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

// Function to fetch all documents from a collection
async function getCollection(collectionRef, collectionPath = '') {
  const snapshot = await collectionRef.get();
  
  const result = {};
  
  for (const doc of snapshot.docs) {
    // Get document data and convert timestamps
    const docData = convertTimestamps(doc.data());
    
    // Add document to result
    result[doc.id] = docData;
    
    // Get subcollections
    const subcollections = await doc.ref.listCollections();
    
    // If there are subcollections, get their data recursively
    if (subcollections.length > 0) {
      const subcollectionsData = {};
      
      for (const subcoll of subcollections) {
        const subcollData = await getCollection(subcoll, `${collectionPath}/${doc.id}/${subcoll.id}`);
        if (Object.keys(subcollData).length > 0) {
          subcollectionsData[subcoll.id] = subcollData;
        }
      }
      
      // Add subcollections data to document
      if (Object.keys(subcollectionsData).length > 0) {
        result[doc.id]._subcollections = subcollectionsData;
      }
    }
  }
  
  return result;
}

// Main function
async function exportData() {
  console.log('Starting Firestore export in human-readable format...');
  
  try {
    const result = {};
    
    if (collectionName) {
      // Export a specific collection
      console.log(`Exporting collection: ${collectionName}`);
      const collectionRef = db.collection(collectionName);
      result[collectionName] = await getCollection(collectionRef, collectionName);
    } else {
      // Export all collections
      console.log('Exporting all collections...');
      const collections = await db.listCollections();
      
      for (const collection of collections) {
        console.log(`  - Processing collection: ${collection.id}`);
        result[collection.id] = await getCollection(collection, collection.id);
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