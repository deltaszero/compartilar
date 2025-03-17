import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

type Params = { params: { id: string } };

export async function GET(
  request: NextRequest,
  { params }: Params
) {
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get child ID from params
    const childId = params.id;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Get the child document from Firestore
    const childDoc = await adminDb().collection('children').doc(childId).get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childData = childDoc.data();
    
    // Check if user has permission to view this child
    const isOwner = childData?.owner === userId;
    const isEditor = childData?.editors?.includes(userId);
    const isViewer = childData?.viewers?.includes(userId);
    
    if (!isOwner && !isEditor && !isViewer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return the child data
    return NextResponse.json({ 
      id: childDoc.id,
      ...childData
    });
    
  } catch (error) {
    console.error('Error fetching child:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: Params
) {
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get child ID from params
    const childId = params.id;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Get request body
    const updates = await request.json();
    
    // Get the child document from Firestore
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childData = childDoc.data();
    
    // Check if user has permission to edit this child
    const isOwner = childData?.owner === userId;
    const isEditor = childData?.editors?.includes(userId);
    
    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Add history entry if provided
    if (updates.historyEntry) {
      const historyEntryData = {
        ...updates.historyEntry,
        timestamp: FieldValue.serverTimestamp(),
        userId: userId
      };
      
      // Add to history subcollection
      await childRef.collection('history').add(historyEntryData);
      
      // Remove from updates to prevent adding to main document
      delete updates.historyEntry;
    }

    // Remove any fields that shouldn't be updated directly
    delete updates.owner;
    delete updates.editors;
    delete updates.viewers;
    
    // Add updated_at timestamp
    updates.updated_at = FieldValue.serverTimestamp();
    
    // Update the child document
    await childRef.update(updates);
    
    return NextResponse.json({ 
      success: true,
      message: 'Child updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get child ID from params
    const childId = params.id;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Get the child document from Firestore
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childData = childDoc.data();
    
    // Check if user is the owner
    if (childData?.owner !== userId) {
      return NextResponse.json({ error: 'Only the owner can delete a child' }, { status: 403 });
    }

    // Soft delete - update with deleted flag
    await childRef.update({
      deleted: true,
      deleted_at: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Child deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting child:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}