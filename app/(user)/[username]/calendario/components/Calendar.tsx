"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@context/userContext';
import dayjs from 'dayjs';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { DayEvents } from './DayEvents';
import { EventForm } from './EventForm';
import { CalendarProps, CalendarEventWithChild, EventFormData } from './types';
import { Child } from '@/types/user.types';
import { toast } from 'react-hot-toast';
import {
  fetchChildren,
  fetchCoParentingRelationships,
  fetchEvents,
  saveEvent,
  deleteEvent,
  generateCalendarDays
} from './calendar-service';

export function Calendar({ initialMonth }: CalendarProps) {
  const { userData } = useUser();
  const [currentMonth, setCurrentMonth] = useState(dayjs(initialMonth || new Date()));
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [coParentingRelationships, setCoParentingRelationships] = useState<string[]>([]);
  const [events, setEvents] = useState<CalendarEventWithChild[]>([]);
  const [calendarDays, setCalendarDays] = useState<{ date: dayjs.Dayjs; isCurrentMonth: boolean; isToday: boolean; events: CalendarEventWithChild[]; isSelected: boolean; }[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log(loading);

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
        toast.error('Erro ao carregar dados iniciais');
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
        const startDate = currentMonth.startOf('month').subtract(7, 'day').toDate();
        const endDate = currentMonth.endOf('month').add(7, 'day').toDate();
        
        const eventsData = await fetchEvents(
          userData.uid,
          startDate,
          endDate,
          children
        );
        
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
        toast.error('Erro ao carregar eventos');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [userData, currentMonth, children, coParentingRelationships]);
  
  // Generate calendar days
  useEffect(() => {
    const days = generateCalendarDays(currentMonth, selectedDate, events);
    setCalendarDays(days);
  }, [currentMonth, selectedDate, events]);
  
  // Navigation functions
  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };
  
  const handleTodayClick = () => {
    const today = dayjs();
    setCurrentMonth(today);
    setSelectedDate(today);
  };
  
  // Date selection
  const handleSelectDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };
  
  // Event form handling
  const handleAddEvent = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setShowEventForm(true);
  };
  
  const handleEditEvent = (date: dayjs.Dayjs, event: CalendarEventWithChild) => {
    setSelectedDate(date);
    setSelectedEvent(event);
    setShowEventForm(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
      await deleteEvent(eventId);
      
      // Update events list by removing the deleted event
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast.success('Evento excluído com sucesso');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
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
      const startDate = currentMonth.startOf('month').subtract(7, 'day').toDate();
      const endDate = currentMonth.endOf('month').add(7, 'day').toDate();
      
      const updatedEvents = await fetchEvents(
        userData.uid,
        startDate,
        endDate,
        children
      );
      
      setEvents(updatedEvents);
      setShowEventForm(false);
      
      toast.success(selectedEvent 
        ? 'Evento atualizado com sucesso' 
        : 'Evento criado com sucesso'
      );
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erro ao salvar evento');
    }
  };
  
  if (!userData) {
    return <div className="p-4 text-center text-muted-foreground">Faça login para visualizar o calendário</div>;
  }
  
  const selectedDayEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = dayjs(event.startTime.toDate());
        return eventDate.isSame(selectedDate, 'day');
      })
    : [];
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onTodayClick={handleTodayClick}
        />
        
        <CalendarGrid
          days={calendarDays}
          onSelectDate={handleSelectDate}
          onDoubleClick={handleAddEvent}
        />
      </div>
      
      <div className="w-full lg:w-80 bg-background rounded-md border shadow-sm">
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