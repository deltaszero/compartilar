'use client';

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { GeoLocation } from '@/types/shared.types';

// Function to save a geolocation to Firestore
export async function saveGeolocation(
  coordinates: { latitude: number; longitude: number; accuracy?: number },
  note: string | null = null
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Try to get username either from displayName or account_info
    let username = user.displayName || '';
    
    try {
      const accountDocRef = doc(db, 'account_info', user.uid);
      const accountDoc = await getDoc(accountDocRef);
      
      if (accountDoc.exists()) {
        const data = accountDoc.data();
        if (data.username) {
          username = data.username;
        }
      }
    } catch (error) {
      console.warn('Could not fetch username from account_info, using fallback', error);
    }
    
    // If we still don't have a username, use a default 
    if (!username) {
      username = `user_${user.uid.substring(0, 6)}`;
    }

    // Detect browser and platform info
    const userAgent = navigator.userAgent;
    const deviceInfo = {
      browser: getBrowserInfo(userAgent),
      platform: getPlatformInfo(userAgent),
      mobile: isMobileDevice(userAgent)
    };

    // Create the geolocation document - remove undefined fields
    const geoLocationData: Omit<GeoLocation, 'id'> = {
      userId: user.uid,
      username,
      coordinates,
      timestamp: Timestamp.now(),
      deviceInfo
    };

    // Only add note if it's defined and not empty
    if (note) {
      geoLocationData.note = note;
    }

    // Add document to Firestore
    const docRef = await addDoc(collection(db, 'geolocations'), geoLocationData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving geolocation:', error);
    throw error;
  }
}

// Function to get user's geolocation history
export async function getUserGeolocations(
  userId: string,
  maxResults: number = 20
): Promise<GeoLocation[]> {
  try {
    const geolocationsRef = collection(db, 'geolocations');
    const q = query(
      geolocationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GeoLocation[];
  } catch (error) {
    console.error('Error getting geolocation history:', error);
    throw error;
  }
}

// Function to delete a geolocation
export async function deleteGeolocation(locationId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the location document to verify ownership
    const locationDocRef = doc(db, 'geolocations', locationId);
    const locationDoc = await getDoc(locationDocRef);
    
    if (!locationDoc.exists()) {
      throw new Error('Location not found');
    }
    
    // Verify ownership
    if (locationDoc.data().userId !== user.uid) {
      throw new Error('Not authorized to delete this location');
    }

    // Delete the document
    await deleteDoc(locationDocRef);
  } catch (error) {
    console.error('Error deleting geolocation:', error);
    throw error;
  }
}

// Helper function to get browser information
function getBrowserInfo(userAgent: string): string {
  const browsers = [
    { name: 'Chrome', test: /Chrome/ },
    { name: 'Firefox', test: /Firefox/ },
    { name: 'Safari', test: /Safari/ },
    { name: 'Edge', test: /Edg/ },
    { name: 'Opera', test: /Opera/ },
    { name: 'IE', test: /MSIE|Trident/ }
  ];

  for (const browser of browsers) {
    if (browser.test.test(userAgent)) {
      return browser.name;
    }
  }

  return 'Unknown';
}

// Helper function to get platform information
function getPlatformInfo(userAgent: string): string {
  const platforms = [
    { name: 'Windows', test: /Windows/ },
    { name: 'Mac', test: /Mac/ },
    { name: 'iOS', test: /iPhone|iPad|iPod/ },
    { name: 'Android', test: /Android/ },
    { name: 'Linux', test: /Linux/ }
  ];

  for (const platform of platforms) {
    if (platform.test.test(userAgent)) {
      return platform.name;
    }
  }

  return 'Unknown';
}

// Helper function to detect mobile devices
function isMobileDevice(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}