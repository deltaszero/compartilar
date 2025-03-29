import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * GET - Fetch calendar events based on date range and child ID
 */
export async function GET(request: NextRequest) {
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
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const childId = url.searchParams.get('childId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Validate required parameters
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
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
    
    // Set up date range filtering
    let queryRef = childRef.collection('events');
    
    // Apply date filters if provided
    if (startDate) {
      const startDateTime = new Date(startDate);
      queryRef = queryRef.where('startDate', '>=', Timestamp.fromDate(startDateTime));
    }
    
    // For date range queries, we need to order by the same field
    queryRef = queryRef.orderBy('startDate', 'asc');
    
    // Execute query
    const eventsSnapshot = await queryRef.get();
    
    // Filter by end date in memory (since Firestore can only have one range operator)
    let events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamps to ISO strings for serialization
      const startDateISO = data.startDate ? data.startDate.toDate().toISOString() : null;
      const endDateISO = data.endDate ? data.endDate.toDate().toISOString() : null;
      const createdAtISO = data.createdAt ? data.createdAt.toDate().toISOString() : null;
      const updatedAtISO = data.updatedAt ? data.updatedAt.toDate().toISOString() : null;
      
      return {
        id: doc.id,
        ...data,
        childId,
        startDate: startDateISO,
        endDate: endDateISO,
        createdAt: createdAtISO,
        updatedAt: updatedAtISO
      };
    });
    
    // Filter by end date if provided
    if (endDate) {
      const endDateTime = new Date(endDate);
      events = events.filter(event => {
        const eventStartDate = new Date(event.startDate);
        return eventStartDate <= endDateTime;
      });
    }
    
    // Filter private events that don't belong to the user
    events = events.filter(event => {
      return !event.isPrivate || event.createdBy === userId;
    });
    
    return NextResponse.json({ events });
    
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create a new calendar event
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const eventData = await request.json();
    
    // Validate required fields
    if (!eventData.childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    if (!eventData.title) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }
    
    if (!eventData.startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }
    
    // Check if child exists and user has permission
    const childRef = adminDb().collection('children').doc(eventData.childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childData = childDoc.data();
    
    // Check if user is editor (only editors can create events)
    const isEditor = childData?.editors?.includes(userId);
    
    if (!isEditor) {
      return NextResponse.json({ error: 'Only editors can create calendar events' }, { status: 403 });
    }
    
    // Parse dates
    let startDate, endDate;
    try {
      startDate = new Date(eventData.startDate);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid start date format' }, { status: 400 });
    }
    
    try {
      endDate = eventData.endDate ? new Date(eventData.endDate) : new Date(startDate);
      // Default to 1 hour event if no end date
      if (!eventData.endDate) {
        endDate.setHours(endDate.getHours() + 1);
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid end date format' }, { status: 400 });
    }
    
    // Create event object with clean data
    const newEvent = {
      title: eventData.title,
      description: eventData.description || '',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      category: eventData.category || 'other',
      childId: eventData.childId,
      location: { address: eventData.location || '' },
      responsibleParentId: eventData.responsibleParentId || userId,
      checkInRequired: !!eventData.checkInRequired,
      isPrivate: !!eventData.isPrivate,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Add recurrence if provided
    if (eventData.recurring && eventData.recurrenceType) {
      newEvent.recurrence = {
        type: eventData.recurrenceType,
        interval: eventData.recurrenceInterval || 1,
        endDate: eventData.recurrenceEndDate ? 
          Timestamp.fromDate(new Date(eventData.recurrenceEndDate)) : 
          undefined,
        occurrences: eventData.recurrenceOccurrences
      };
    }
    
    // Add reminder if provided
    if (eventData.reminderEnabled) {
      newEvent.reminder = {
        enabled: true,
        reminderTime: eventData.reminderTime || 30 // Default 30 minutes before
      };
    }
    
    // Create a batch for transaction
    const batch = adminDb().batch();
    
    // Add the event
    const eventsRef = childRef.collection('events');
    const newEventRef = eventsRef.doc();
    batch.set(newEventRef, newEvent);
    
    // Add change history entry
    const historyRef = childRef.collection('change_history').doc();
    batch.set(historyRef, {
      eventId: newEventRef.id,
      action: 'create_event',
      userId,
      timestamp: FieldValue.serverTimestamp(),
      changes: {
        title: newEvent.title,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        category: newEvent.category
      }
    });
    
    // Commit the batch
    await batch.commit();
    
    // Return success with the new event ID
    return NextResponse.json({ 
      success: true,
      message: 'Event created successfully',
      eventId: newEventRef.id 
    });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}