import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { serverTimestamp } from 'firebase-admin/firestore';

/**
 * POST handler to create a new child
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }

  // Auth verification
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      birthDate, 
      gender, 
      photoURL, 
      notes, 
      viewers = [],
      editors = []
    } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'First name, last name, and birth date are required' 
      }, { status: 400 });
    }
    
    // Make sure the creator is in the editors list
    if (!editors.includes(userId)) {
      editors.push(userId);
    }
    
    // Check premium status for multiple children
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }
    
    const isPremium = userData.subscriptionStatus === 'active';
    
    // Count existing children where user is creator
    const existingChildrenQuery = await adminDb.collection('children')
      .where('createdBy', '==', userId)
      .where('isDeleted', '==', false)
      .get();
    
    const childCount = existingChildrenQuery.size;
    
    // Check if free user has reached their limit
    if (!isPremium && childCount >= 1) {
      return NextResponse.json({ 
        error: 'Free tier limit reached',
        message: 'Free users can create only 1 child. Upgrade to premium for unlimited children.'
      }, { status: 403 });
    }
    
    // Create child document
    const childRef = adminDb.collection('children').doc();
    
    // Prepare child data
    const childData = {
      firstName,
      lastName,
      birthDate,
      gender: gender || null,
      photoURL: photoURL || null,
      notes: notes || "",
      createdBy: userId,
      editors,
      viewers,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false
    };
    
    // Write to database
    await childRef.set(childData);
    
    // Return success with new child ID
    return NextResponse.json({
      success: true,
      id: childRef.id,
      message: 'Child created successfully'
    });
    
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}