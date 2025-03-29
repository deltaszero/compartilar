import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Define interfaces for type safety
interface CalendarEvent {
  id: string;
  childId: string;
  title: string;
  description?: string;
  startDate: any; // Timestamp
  endDate: any; // Timestamp
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  category?: string;
  location?: { address: string };
  isPrivate?: boolean;
  createdBy?: string;
  recurrence?: {
    type: string;
    interval: number;
    endDate?: any; // Timestamp
    occurrences?: number;
  };
  reminder?: {
    enabled: boolean;
    reminderTime: number;
  };
  [key: string]: any; // For other properties
}

/**
 * GET - Fetch calendar events for a specific child based on date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    // Get child ID from path parameter - using await for Next.js 15 compatibility
    const { id: childId } = await params;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
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
    const eventsRef = childRef.collection('events');
    
    // Create the base query
    let query = eventsRef.orderBy('startDate', 'asc');
    
    // Apply date filters if provided
    if (startDate) {
      const startDateTime = new Date(startDate);
      query = query.where('startDate', '>=', Timestamp.fromDate(startDateTime));
    }
    
    // Execute query
    const eventsSnapshot = await query.get();
    
    // Filter by end date in memory (since Firestore can only have one range operator)
    let events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamps to ISO strings for serialization
      const startDateISO = data.startDate ? data.startDate.toDate().toISOString() : null;
      const endDateISO = data.endDate ? data.endDate.toDate().toISOString() : null;
      const createdAtISO = data.createdAt ? data.createdAt.toDate().toISOString() : null;
      const updatedAtISO = data.updatedAt ? data.updatedAt.toDate().toISOString() : null;
      
      const event: CalendarEvent = {
        id: doc.id,
        ...data,
        childId,
        title: data.title || '',
        startDate: startDateISO,
        endDate: endDateISO,
        createdAt: createdAtISO,
        updatedAt: updatedAtISO
      };
      
      return event;
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
 * POST - Create a new calendar event for a specific child
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    // Get child ID from path parameter - using await for Next.js 15 compatibility
    const { id: childId } = await params;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }
    
    // Get request body
    const eventData = await request.json();
    
    // Validate required fields
    if (!eventData.title) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }
    
    if (!eventData.startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }
    
    // Check if child exists and user has permission
    const childRef = adminDb().collection('children').doc(childId);
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
    const newEventData: any = {
      title: eventData.title,
      description: eventData.description || '',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      category: eventData.category || 'other',
      childId,
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
      newEventData.recurrence = {
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
      newEventData.reminder = {
        enabled: true,
        reminderTime: eventData.reminderTime || 30 // Default 30 minutes before
      };
    }
    
    // Create a batch for transaction
    const batch = adminDb().batch();
    
    // Add the event
    const eventsRef = childRef.collection('events');
    const newEventRef = eventsRef.doc();
    batch.set(newEventRef, newEventData);
    
    // Add change history entry
    const historyRef = childRef.collection('change_history').doc();
    batch.set(historyRef, {
      eventId: newEventRef.id,
      action: 'create_event',
      userId,
      timestamp: FieldValue.serverTimestamp(),
      changes: {
        title: newEventData.title,
        startDate: newEventData.startDate,
        endDate: newEventData.endDate,
        category: newEventData.category
      }
    });
    
    // Commit the batch
    await batch.commit();
    
    // Return success with the new event ID
    return NextResponse.json({ 
      success: true,
      message: 'Event created successfully',
      eventId: newEventRef.id,
      event: {
        id: newEventRef.id,
        ...newEventData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}