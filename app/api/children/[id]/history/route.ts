import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get the child document to check permissions
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Fetch history entries, ordered by timestamp (descending)
    const historySnapshot = await adminDb()
      .collection('children')
      .doc(childId)
      .collection('change_history') // Using change_history instead of history to match where data is saved
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    // Process the history entries
    const historyEntries = [];
    historySnapshot.forEach(doc => {
      const entry = doc.data();
      
      // Convert Firebase timestamp to serializable format
      const timestamp = entry.timestamp ? entry.timestamp.toDate().toISOString() : null;
      
      historyEntries.push({
        id: doc.id,
        ...entry,
        timestamp
      });
    });
    
    return NextResponse.json(historyEntries);
    
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get the child document to check permissions
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

    // Get the history entry data from the request
    const entryData = await request.json();
    
    // Add required fields
    const historyEntry = {
      ...entryData,
      userId, // Who made the change
      timestamp: FieldValue.serverTimestamp()
    };
    
    // Add to change_history collection (matching where data is saved)
    const historyRef = childRef.collection('change_history');
    const result = await historyRef.add(historyEntry);
    
    return NextResponse.json({ 
      success: true,
      id: result.id,
      message: 'History entry added successfully'
    });
    
  } catch (error) {
    console.error('Error adding history entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}