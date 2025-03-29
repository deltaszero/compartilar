import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * GET - Fetch a single calendar event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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
    
    // Get parameters from path - using await for Next.js 15 compatibility
    const { id: childId, eventId } = await params;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Check if child exists and user has permission
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childData = childDoc.data();
    
    // Check if user is editor or viewer
    const isEditor = childData?.editors?.includes(userId);
    const isViewer = childData?.viewers?.includes(userId);
    const isParent = childData?.parentId === userId;
    const isOwner = childData?.ownerId === userId;
    const isCreator = childData?.createdBy === userId;
    
    if (!isEditor && !isViewer && !isParent && !isOwner && !isCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get the event document
    const eventRef = childRef.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const eventData = eventDoc.data();
    
    // Check if event is private and belongs to another user
    if (eventData.isPrivate && eventData.createdBy !== userId) {
      return NextResponse.json({ error: 'Access denied to private event' }, { status: 403 });
    }
    
    // Convert timestamps to ISO strings for serialization
    const startDate = eventData.startDate ? eventData.startDate.toDate().toISOString() : null;
    const endDate = eventData.endDate ? eventData.endDate.toDate().toISOString() : null;
    const createdAt = eventData.createdAt ? eventData.createdAt.toDate().toISOString() : null;
    const updatedAt = eventData.updatedAt ? eventData.updatedAt.toDate().toISOString() : null;
    
    // If recurrence has an end date, convert it too
    let recurrence = eventData.recurrence;
    if (recurrence && recurrence.endDate) {
      recurrence = {
        ...recurrence,
        endDate: recurrence.endDate.toDate().toISOString()
      };
    }
    
    // Return the event data
    return NextResponse.json({ 
      id: eventDoc.id,
      ...eventData,
      childId,
      startDate,
      endDate,
      createdAt,
      updatedAt,
      recurrence
    });
    
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update an existing calendar event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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
    
    // Get parameters from path - using await for Next.js 15 compatibility
    const { id: childId, eventId } = await params;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Get update data
    const updates = await request.json();
    
    // Check if child exists and user has permission
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childData = childDoc.data();
    
    // Check if user is editor (only editors can update events)
    const isEditor = childData?.editors?.includes(userId);
    const isParent = childData?.parentId === userId;
    const isOwner = childData?.ownerId === userId;
    const isCreator = childData?.createdBy === userId;
    
    if (!isEditor && !isParent && !isOwner && !isCreator) {
      return NextResponse.json({ error: 'Only editors can update calendar events' }, { status: 403 });
    }
    
    // Get the event document
    const eventRef = childRef.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const eventData = eventDoc.data();
    
    // Check if event is private and belongs to another user
    if (eventData.isPrivate && eventData.createdBy !== userId) {
      return NextResponse.json({ error: 'Cannot modify another user\'s private event' }, { status: 403 });
    }
    
    // Store original values for changelog
    const beforeValues = {
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      category: eventData.category,
      location: eventData.location,
      isPrivate: eventData.isPrivate
    };
    
    // Prepare update object
    const updateData = {
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    // Process title update
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    
    // Process description update
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    
    // Process start date update
    if (updates.startDate) {
      try {
        const startDate = new Date(updates.startDate);
        updateData.startDate = Timestamp.fromDate(startDate);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid start date format' }, { status: 400 });
      }
    }
    
    // Process end date update
    if (updates.endDate) {
      try {
        const endDate = new Date(updates.endDate);
        updateData.endDate = Timestamp.fromDate(endDate);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid end date format' }, { status: 400 });
      }
    }
    
    // Process category update
    if (updates.category) {
      updateData.category = updates.category;
    }
    
    // Process location update
    if (updates.location !== undefined) {
      updateData.location = { address: updates.location || '' };
    }
    
    // Process privacy update
    if (updates.isPrivate !== undefined) {
      updateData.isPrivate = !!updates.isPrivate;
    }
    
    // Process recurrence update
    if (updates.recurring !== undefined) {
      if (updates.recurring && updates.recurrenceType) {
        updateData.recurrence = {
          type: updates.recurrenceType,
          interval: updates.recurrenceInterval || 1
        };
        
        if (updates.recurrenceEndDate) {
          try {
            updateData.recurrence.endDate = Timestamp.fromDate(new Date(updates.recurrenceEndDate));
          } catch (error) {
            return NextResponse.json({ error: 'Invalid recurrence end date format' }, { status: 400 });
          }
        } else if (updates.recurrenceOccurrences) {
          updateData.recurrence.occurrences = updates.recurrenceOccurrences;
        }
      } else {
        // Remove recurrence if it's being disabled
        updateData.recurrence = FieldValue.delete();
      }
    }
    
    // Process reminder update
    if (updates.reminderEnabled !== undefined) {
      if (updates.reminderEnabled) {
        updateData.reminder = {
          enabled: true,
          reminderTime: updates.reminderTime || 30 // Default 30 minutes before
        };
      } else {
        // Remove reminder if it's being disabled
        updateData.reminder = FieldValue.delete();
      }
    }
    
    // Create a batch for transaction
    const batch = adminDb().batch();
    
    // Update the event
    batch.update(eventRef, updateData);
    
    // Add change history entry
    const historyRef = childRef.collection('change_history').doc();
    batch.set(historyRef, {
      eventId,
      action: 'update_event',
      userId,
      timestamp: FieldValue.serverTimestamp(),
      fieldsBefore: beforeValues,
      fieldsAfter: {
        title: updates.title,
        description: updates.description,
        startDate: updates.startDate ? new Date(updates.startDate).toISOString() : undefined,
        endDate: updates.endDate ? new Date(updates.endDate).toISOString() : undefined,
        category: updates.category,
        location: updates.location,
        isPrivate: updates.isPrivate
      }
    });
    
    // Commit the batch
    await batch.commit();
    
    // Return updated event data with converted timestamps
    const updatedStartDate = updateData.startDate ? 
      updateData.startDate.toDate().toISOString() : 
      eventData.startDate.toDate().toISOString();
      
    const updatedEndDate = updateData.endDate ? 
      updateData.endDate.toDate().toISOString() : 
      eventData.endDate.toDate().toISOString();
    
    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully',
      event: {
        id: eventId,
        childId,
        ...eventData,
        ...updateData,
        startDate: updatedStartDate,
        endDate: updatedEndDate,
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete a calendar event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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
    
    // Get parameters from path - using await for Next.js 15 compatibility
    const { id: childId, eventId } = await params;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Check if child exists and user has permission
    const childRef = adminDb().collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childData = childDoc.data();
    
    // Check if user is editor (only editors can delete events)
    const isEditor = childData?.editors?.includes(userId);
    const isParent = childData?.parentId === userId;
    const isOwner = childData?.ownerId === userId;
    const isCreator = childData?.createdBy === userId;
    
    if (!isEditor && !isParent && !isOwner && !isCreator) {
      return NextResponse.json({ error: 'Only editors can delete calendar events' }, { status: 403 });
    }
    
    // Get the event document
    const eventRef = childRef.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const eventData = eventDoc.data();
    
    // Check if event is private and belongs to another user
    if (eventData.isPrivate && eventData.createdBy !== userId) {
      return NextResponse.json({ error: 'Cannot delete another user\'s private event' }, { status: 403 });
    }
    
    // Create a batch for transaction
    const batch = adminDb().batch();
    
    // Delete the event
    batch.delete(eventRef);
    
    // Add change history entry
    const historyRef = childRef.collection('change_history').doc();
    batch.set(historyRef, {
      eventId,
      action: 'delete_event',
      userId,
      timestamp: FieldValue.serverTimestamp(),
      deletedEvent: {
        title: eventData.title,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        category: eventData.category
      }
    });
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}