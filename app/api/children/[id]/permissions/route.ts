import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Handle adding users to editors or viewers list
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

    // Get request body
    const data = await request.json();
    const { userId: targetUserId, type } = data;
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!type || (type !== 'editor' && type !== 'viewer')) {
      return NextResponse.json({ error: 'Valid type (editor or viewer) is required' }, { status: 400 });
    }

    // Get the child document
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childData = childDoc.data();
    
    // Check if the requester is the owner of the child
    if (childData?.owner !== userId) {
      return NextResponse.json({ error: 'Only the owner can modify permissions' }, { status: 403 });
    }
    
    // Check if the target user already has this permission
    const targetField = type === 'editor' ? 'editors' : 'viewers';
    if (childData[targetField] && childData[targetField].includes(targetUserId)) {
      return NextResponse.json({ 
        error: `User is already an ${type}`,
        success: false  
      });
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp()
    };
    
    // Add user to the appropriate list
    updateData[targetField] = FieldValue.arrayUnion(targetUserId);
    
    // If adding as editor, remove from viewers if present
    if (type === 'editor' && childData.viewers && childData.viewers.includes(targetUserId)) {
      updateData['viewers'] = FieldValue.arrayRemove(targetUserId);
    }
    
    // Update the document
    await childRef.update(updateData);
    
    // Create history entry
    const historyRef = childRef.collection('change_history');
    await historyRef.add({
      action: 'permission_change',
      type: 'add',
      permission: type,
      userId: targetUserId,
      createdBy: userId,
      timestamp: FieldValue.serverTimestamp(),
      description: `Added user as ${type}`
    });
    
    return NextResponse.json({ 
      success: true,
      message: `User added as ${type} successfully`
    });
    
  } catch (error) {
    console.error('Error adding user permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle removing users from editors or viewers list
export async function DELETE(
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

    // Get request body
    const data = await request.json();
    const { userId: targetUserId, type } = data;
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!type || (type !== 'editor' && type !== 'viewer')) {
      return NextResponse.json({ error: 'Valid type (editor or viewer) is required' }, { status: 400 });
    }

    // Get the child document
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const childData = childDoc.data();
    
    // Check if the requester is the owner of the child
    if (childData?.owner !== userId) {
      return NextResponse.json({ error: 'Only the owner can modify permissions' }, { status: 403 });
    }
    
    // Can't remove the owner
    if (targetUserId === childData.owner) {
      return NextResponse.json({ error: 'Cannot remove owner from editors' }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp()
    };
    
    // Remove user from the appropriate list
    const targetField = type === 'editor' ? 'editors' : 'viewers';
    updateData[targetField] = FieldValue.arrayRemove(targetUserId);
    
    // Update the document
    await childRef.update(updateData);
    
    // Create history entry
    const historyRef = childRef.collection('change_history');
    await historyRef.add({
      action: 'permission_change',
      type: 'remove',
      permission: type,
      userId: targetUserId,
      createdBy: userId,
      timestamp: FieldValue.serverTimestamp(),
      description: `Removed user from ${type}s`
    });
    
    return NextResponse.json({ 
      success: true,
      message: `User removed from ${type}s successfully`
    });
    
  } catch (error) {
    console.error('Error removing user permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}