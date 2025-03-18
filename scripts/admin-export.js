#!/usr/bin/env node

/**
 * Admin-level Firestore export script for CompartiLar
 * 
 * This script uses the Firebase Admin SDK to export all data from your Firestore
 * database in a clean, human-readable JSON format.
 * 
 * Prerequisites:
 * - You need a service account key file from Firebase
 *   (Project Settings > Service accounts > Generate new private key)
 * 
 * Usage:
 * node admin-export.js --key=/path/to/serviceAccountKey.json [--collection=name] [--output=path]
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Parse command line arguments
const args = process.argv.slice(2);
let keyPath = null;
let collectionName = null;
let outputPath = null;
let pretty = true;

for (const arg of args) {
  if (arg.startsWith('--key=')) {
    keyPath = arg.split('=')[1];
  } else if (arg.startsWith('--collection=')) {
    collectionName = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputPath = arg.split('=')[1];
  } else if (arg === '--no-pretty') {
    pretty = false;
  } else if (arg.startsWith('--help') || arg === '-h') {
    console.log(`
Admin-level Firestore export script for CompartiLar

Usage:
node admin-export.js --key=/path/to/serviceAccountKey.json [--collection=name] [--output=path] [--no-pretty]

Options:
--key=path          : Path to Firebase service account key JSON file (REQUIRED)
--collection=name   : Only export the specified collection (default: export all)
--output=path       : Output file path (default: "./firestore-export-{timestamp}.json")
--no-pretty         : Don't format JSON with indentation
--help, -h          : Show this help message
    `);
    process.exit(0);
  }
}

// Check for required key path
if (!keyPath) {
  console.error('Error: Service account key path is required');
  console.error('Use --key=/path/to/serviceAccountKey.json to specify the key file');
  console.error('You can generate a key from Firebase console under Project Settings > Service accounts');
  process.exit(1);
}

// Generate default output path if not provided
if (!outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  outputPath = `./firestore-export-${timestamp}.json`;
}

// Initialize Firebase Admin with the provided service account
try {
  const serviceAccount = require(path.resolve(keyPath));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log(`Initialized Firebase Admin SDK for project: ${serviceAccount.project_id}`);
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error(`Could not find service account key file at: ${keyPath}`);
    console.error('Make sure the path is correct and the file exists');
  }
  process.exit(1);
}

const db = admin.firestore();

// Function to convert Firestore timestamps to ISO strings
function convertTimestamps(data) {
  if (!data) return data;
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (data && typeof data === 'object' && data._seconds !== undefined && data._nanoseconds !== undefined) {
    // This is a Firestore Timestamp
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
  try {
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`No documents found in collection: ${collectionPath || collectionRef.path}`);
      return {};
    }
    
    console.log(`Found ${snapshot.size} documents in collection: ${collectionPath || collectionRef.path}`);
    
    const result = {};
    
    // Process each document in the collection
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
          console.log(`Processing subcollection: ${subcoll.path}`);
          const subcollData = await getCollection(subcoll, subcoll.path);
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
  } catch (error) {
    console.error(`Error getting collection ${collectionPath || collectionRef.path}:`, error);
    return {};
  }
}

// Main function to export data
async function exportData() {
  console.log('Starting Firestore export in human-readable format...');
  
  try {
    const result = {};
    
    if (collectionName) {
      // Export a specific collection
      console.log(`Exporting collection: ${collectionName}`);
      const collectionRef = db.collection(collectionName);
      result[collectionName] = await getCollection(collectionRef);
    } else {
      // Export all collections
      console.log('Exporting all collections...');
      const collections = await db.listCollections();
      
      for (const collection of collections) {
        console.log(`Processing collection: ${collection.id}`);
        result[collection.id] = await getCollection(collection);
      }
    }
    
    // Write the result to file
    console.log(`Writing export to ${outputPath}...`);
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