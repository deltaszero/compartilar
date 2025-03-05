"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/context/userContext';
import { 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  addDays,
  isSameDay, 
  // format
} from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { DayEvents } from './DayEvents';
import { EventForm } from './EventForm';
import { CalendarProps, CalendarEventWithChild, EventFormData } from './types';
// import { toast } from 'sonner';
import {
  fetchChildren,
  fetchCoParentingRelationships,
  fetchEvents,
  saveEvent,
  deleteEvent,
  generateCalendarDays,
  // getEventsForDay
} from './calendar-service';

export default function Calendar({ initialMonth }: CalendarProps) {
  const { userData } = useUser();
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Initialize with today's date
  const [children, setChildren] = useState<any[]>([]);
  const [coParentingRelationships, setCoParentingRelationships] = useState<string[]>([]);
  const [events, setEvents] = useState<CalendarEventWithChild[]>([]);
  const [calendarDays, setCalendarDays] = useState<{ date: Date; isCurrentMonth: boolean; isToday: boolean; events: CalendarEventWithChild[]; isSelected: boolean; }[]>([]);
  const [loading, setLoading] = useState(true);

  console.log(loading)
  
  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithChild | undefined>(undefined);
  
  // Load children and relationships
  useEffect(() => {
    if (!userData) return;
    
    const loadInitialData = async () => {
      try {
        const [childrenData, relationships] = await Promise.all([
          fetchChildren(userData.uid),
          fetchCoParentingRelationships(userData.uid)
        ]);
        
        setChildren(childrenData);
        setCoParentingRelationships(relationships);
      } catch (error) {
        console.error('Error loading initial data:', error);
        console.error('Error loading initial data');
      }
    };
    
    loadInitialData();
  }, [userData]);
  
  // Load events when month changes
  useEffect(() => {
    if (!userData) return;
    
    const loadEvents = async () => {
      setLoading(true);
      
      try {
        // We load extra days from previous and next months for complete weeks
        const firstDayOfMonth = startOfMonth(currentMonth);
        const lastDayOfMonth = endOfMonth(currentMonth);
        const startDate = subDays(firstDayOfMonth, 7);
        const endDate = addDays(lastDayOfMonth, 7);
        
        const eventsData = await fetchEvents(
          userData.uid,
          startDate,
          endDate,
          children
        );
        
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
        console.error('Error loading events');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [userData, currentMonth, children, coParentingRelationships]);
  
  // Generate calendar days - prevent updates during event form operations
  useEffect(() => {
    if (!showEventForm) {
      const days = generateCalendarDays(currentMonth, selectedDate, events);
      setCalendarDays(days);
    }
  }, [currentMonth, selectedDate, events, showEventForm]);
  
  // Navigation functions
  const handlePrevMonth = () => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const prevMonth = subDays(firstDayOfMonth, 1);
    setCurrentMonth(prevMonth);
  };
  
  const handleNextMonth = () => {
    const lastDayOfMonth = endOfMonth(currentMonth);
    const nextMonth = addDays(lastDayOfMonth, 1);
    setCurrentMonth(nextMonth);
  };
  
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };
  
  // Date selection
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Event form handling - memoize to prevent recreating function on each render
  const handleAddEvent = (date: Date) => {
    // Use a functional update to prevent dependency on current state
    setSelectedDate(currentSelectedDate => {
      // Only update if it's a different date
      return (currentSelectedDate && isSameDay(currentSelectedDate, date)) 
        ? currentSelectedDate 
        : date;
    });
    
    // These don't depend on current state and can be set directly
    setSelectedEvent(undefined);
    setShowEventForm(true);
  };
  
  const handleEditEvent = (date: Date, event: CalendarEventWithChild) => {
    setSelectedDate(date);
    setSelectedEvent(event);
    setShowEventForm(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteEvent(eventId);
      
      // Update events list by removing the deleted event
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      console.log('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      console.error('Error deleting event');
    }
  };
  
  const handleSaveEvent = async (formData: EventFormData) => {
    if (!userData) return;
    
    try {
      await saveEvent(
        formData,
        selectedEvent?.id,
        userData.uid
      );
      
      // After saving, refresh events
      const firstDayOfMonth = startOfMonth(currentMonth);
      const lastDayOfMonth = endOfMonth(currentMonth);
      const startDate = subDays(firstDayOfMonth, 7);
      const endDate = addDays(lastDayOfMonth, 7);
      
      const updatedEvents = await fetchEvents(
        userData.uid,
        startDate,
        endDate,
        children
      );
      
      setEvents(updatedEvents);
      setShowEventForm(false);
      
      console.log(selectedEvent 
        ? 'Event updated successfully' 
        : 'Event created successfully'
      );
    } catch (error) {
      console.error('Error saving event:', error);
      console.error('Error saving event');
    }
  };
  
  if (!userData) {
    return (
      <div className="p-6 text-center border-4 border-black shadow-brutalist bg-white">
        <p className="text-lg">Please log in to view the calendar</p>
      </div>
    );
  }
  
  const selectedDayEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = event.startTime.toDate();
        return isSameDay(eventDate, selectedDate);
      })
    : [];
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4 min-w-0">
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onTodayClick={handleTodayClick}
        />
        
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[300px] sm:min-w-full">
            <CalendarGrid
              days={calendarDays}
              onSelectDate={handleSelectDate}
              onDoubleClick={handleAddEvent}
            />
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-80 mt-6 lg:mt-0">
        <DayEvents
          selectedDate={selectedDate}
          events={selectedDayEvents}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>
      
      <EventForm
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        event={selectedEvent}
        selectedDate={selectedDate || undefined}
        childrenData={children}
        onSave={handleSaveEvent}
        userId={userData.uid}
      />
    </div>
  );
}