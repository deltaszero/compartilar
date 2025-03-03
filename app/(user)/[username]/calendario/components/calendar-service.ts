import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { CalendarEvent } from '@/types/shared.types';
import { Child } from '@/types/user.types';
import { CalendarEventWithChild, EventFormData } from './types';
import dayjs from 'dayjs';

// Fetch child information
export async function fetchChildren(userId: string): Promise<Child[]> {
  try {
    const childrenQuery = query(
      collection(db, 'children'),
      where('parentId', '==', userId)
    );

    const snapshot = await getDocs(childrenQuery);
    const childrenData: Child[] = [];

    snapshot.forEach(doc => {
      childrenData.push({
        ...doc.data() as Child,
        id: doc.id
      });
    });

    return childrenData;
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

// Fetch co-parenting relationships
export async function fetchCoParentingRelationships(userId: string): Promise<string[]> {
  try {
    // Find relationships where user is parent1
    const parent1Query = query(
      collection(db, 'co_parenting_relationships'),
      where('parent1Id', '==', userId)
    );

    // Find relationships where user is parent2
    const parent2Query = query(
      collection(db, 'co_parenting_relationships'),
      where('parent2Id', '==', userId)
    );

    const [parent1Snapshot, parent2Snapshot] = await Promise.all([
      getDocs(parent1Query),
      getDocs(parent2Query)
    ]);

    const relationshipIds: string[] = [];

    parent1Snapshot.forEach(doc => {
      relationshipIds.push(doc.id);
    });

    parent2Snapshot.forEach(doc => {
      relationshipIds.push(doc.id);
    });

    return relationshipIds;
  } catch (error) {
    console.error('Error fetching co-parenting relationships:', error);
    throw error;
  }
}

// Fetch calendar events for a date range
export async function fetchEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  children: Child[]
): Promise<CalendarEventWithChild[]> {
  try {
    const eventsMap = new Map<string, CalendarEventWithChild>();
    const eventsRef = collection(db, 'calendar_events');

    // Get events created by this user
    const createdByQuery = query(
      eventsRef,
      where('createdBy', '==', userId)
    );

    const createdBySnapshot = await getDocs(createdByQuery);

    createdBySnapshot.forEach(doc => {
      const eventData = doc.data() as CalendarEvent;
      const eventStartTime = eventData.startTime.toDate();

      // Filter by date range
      if (eventStartTime >= startDate && eventStartTime <= endDate) {
        if (!eventsMap.has(doc.id)) {
          const childInfo = children.find(child => child.id === eventData.childId);

          eventsMap.set(doc.id, {
            ...eventData,
            id: doc.id,
            childName: childInfo ? `${childInfo.firstName} ${childInfo.lastName}` : undefined,
            childPhotoURL: childInfo?.photoURL
          });
        }
      }
    });

    // Get events where user is responsible parent
    const responsibleQuery = query(
      eventsRef,
      where('responsibleParentId', '==', userId)
    );

    const responsibleSnapshot = await getDocs(responsibleQuery);

    responsibleSnapshot.forEach(doc => {
      const eventData = doc.data() as CalendarEvent;
      const eventStartTime = eventData.startTime.toDate();

      // Filter by date range
      if (eventStartTime >= startDate && eventStartTime <= endDate) {
        if (!eventsMap.has(doc.id)) {
          const childInfo = children.find(child => child.id === eventData.childId);

          eventsMap.set(doc.id, {
            ...eventData,
            id: doc.id,
            childName: childInfo ? `${childInfo.firstName} ${childInfo.lastName}` : undefined,
            childPhotoURL: childInfo?.photoURL
          });
        }
      }
    });

    // Convert map to array
    return Array.from(eventsMap.values());
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Create or update an event
export async function saveEvent(
  formData: EventFormData,
  existingEventId?: string,
  userId?: string
): Promise<void> {
  try {
    // Convert form data to calendar event format
    const startTimestamp = Timestamp.fromDate(
      new Date(`${formData.startDate}T${formData.startTime}:00`)
    );

    const endTimestamp = Timestamp.fromDate(
      new Date(`${formData.endDate}T${formData.endTime}:00`)
    );

    const eventData: Partial<CalendarEvent> = {
      title: formData.title,
      description: formData.description,
      startTime: startTimestamp,
      endTime: endTimestamp,
      category: formData.category,
      childId: formData.childId || undefined,
      location: { address: formData.location },
      responsibleParentId: formData.responsibleParentId,
      checkInRequired: formData.checkInRequired,
      updatedAt: Timestamp.now()
    };

    if (existingEventId) {
      // Update existing event
      const eventRef = doc(db, 'calendar_events', existingEventId);
      await updateDoc(eventRef, eventData);
    } else {
      // Create new event
      await addDoc(collection(db, 'calendar_events'), {
        ...eventData,
        createdBy: userId,
        createdAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'calendar_events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Get events for a specific day
export function getEventsForDay(
  date: dayjs.Dayjs,
  events: CalendarEventWithChild[]
): CalendarEventWithChild[] {
  return events.filter(event => {
    const startDate = dayjs(event.startTime.toDate());
    return date.isSame(startDate, 'day');
  });
}

// Generate calendar days
export function generateCalendarDays(
  currentMonth: dayjs.Dayjs,
  selectedDate: dayjs.Dayjs | null,
  events: CalendarEventWithChild[]
) {
  const firstDayOfMonth = currentMonth.startOf('month');
  const lastDayOfMonth = currentMonth.endOf('month');
  const startDay = firstDayOfMonth.day(); // 0 = Sunday, 6 = Saturday

  // Create array to hold all calendar days
  const daysArray = [];

  // Add days from previous month to fill the first week
  for (let i = 0; i < startDay; i++) {
    const date = firstDayOfMonth.subtract(startDay - i, 'day');
    daysArray.push({
      date,
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), 'day'),
      isSelected: selectedDate ? selectedDate.isSame(date, 'day') : false,
      events: getEventsForDay(date, events)
    });
  }

  // Add days of current month
  for (let i = 0; i < lastDayOfMonth.date(); i++) {
    const date = firstDayOfMonth.add(i, 'day');
    daysArray.push({
      date,
      isCurrentMonth: true,
      isToday: date.isSame(dayjs(), 'day'),
      isSelected: selectedDate ? selectedDate.isSame(date, 'day') : false,
      events: getEventsForDay(date, events)
    });
  }

  // Add days from next month to complete the grid (total 42 cells for 6 rows)
  const remainingDays = 42 - daysArray.length;
  for (let i = 0; i < remainingDays; i++) {
    const date = lastDayOfMonth.add(i + 1, 'day');
    daysArray.push({
      date,
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), 'day'),
      isSelected: selectedDate ? selectedDate.isSame(date, 'day') : false,
      events: getEventsForDay(date, events)
    });
  }

  return daysArray;
}