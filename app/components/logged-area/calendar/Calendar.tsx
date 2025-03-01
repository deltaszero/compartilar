"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@context/userContext';
import dayjs from 'dayjs';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  or,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { CalendarEvent } from '@/types/shared.types';
import toast from 'react-hot-toast';
import { Child } from '@/types/user.types';

interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEventWithChild[];
}

interface CalendarEventWithChild extends CalendarEvent {
  childName?: string;
  childPhotoURL?: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  category: 'school' | 'medical' | 'activity' | 'visitation' | 'other';
  childId: string;
  responsibleParentId: string;
  checkInRequired: boolean;
}

export default function Calendar() {
  const { userData, loading } = useUser();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [events, setEvents] = useState<CalendarEventWithChild[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [coParentingRelationships, setCoParentingRelationships] = useState<string[]>([]);
  
  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithChild | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: selectedDate.format('YYYY-MM-DD'),
    startTime: '09:00',
    endDate: selectedDate.format('YYYY-MM-DD'),
    endTime: '10:00',
    location: '',
    category: 'other',
    childId: '',
    responsibleParentId: userData?.uid || '',
    checkInRequired: false
  });

  // Load user's children and co-parenting relationships
  useEffect(() => {
    if (userData) {
      loadChildren();
      loadCoParentingRelationships();
    }
  }, [userData]);

  // Load events when month changes or co-parenting relationships are loaded
  useEffect(() => {
    if (userData) {
      loadEvents();
    }
  }, [currentMonth, userData]);

  // Generate calendar days for the month
  useEffect(() => {
    const firstDayOfMonth = currentMonth.startOf('month');
    const lastDayOfMonth = currentMonth.endOf('month');
    const startDay = firstDayOfMonth.day(); // 0 = Sunday, 6 = Saturday
    
    // Create array to hold all calendar days
    const daysArray: CalendarDay[] = [];
    
    // Add days from previous month to fill the first week
    for (let i = 0; i < startDay; i++) {
      const date = firstDayOfMonth.subtract(startDay - i, 'day');
      daysArray.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: date.isSame(selectedDate, 'day'),
        events: getEventsForDay(date)
      });
    }
    
    // Add days of current month
    for (let i = 0; i < lastDayOfMonth.date(); i++) {
      const date = firstDayOfMonth.add(i, 'day');
      daysArray.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(dayjs(), 'day'),
        isSelected: date.isSame(selectedDate, 'day'),
        events: getEventsForDay(date)
      });
    }
    
    // Add days from next month to complete the grid (total 42 cells for 6 rows)
    const remainingDays = 42 - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = lastDayOfMonth.add(i, 'day');
      daysArray.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: date.isSame(selectedDate, 'day'),
        events: getEventsForDay(date)
      });
    }
    
    setCalendarDays(daysArray);
  }, [currentMonth, selectedDate, events]);

  // Get events for a specific day
  const getEventsForDay = (date: dayjs.Dayjs) => {
    return events.filter(event => {
      const startDate = dayjs(event.startTime.toDate());
      return date.isSame(startDate, 'day');
    });
  };

  // Load user's children
  const loadChildren = async () => {
    try {
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', userData?.uid)
      );
      
      const snapshot = await getDocs(childrenQuery);
      const childrenData: Child[] = [];
      
      snapshot.forEach(doc => {
        childrenData.push({
          id: doc.id,
          ...doc.data() as Child
        });
      });
      
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
      toast.error('Erro ao carregar crianças');
    }
  };

  // Load co-parenting relationships
  const loadCoParentingRelationships = async () => {
    try {
      if (!userData) return;
      
      // Find relationships where user is parent1
      const parent1Query = query(
        collection(db, 'co_parenting_relationships'),
        where('parent1Id', '==', userData.uid),
        where('status', '==', 'active')
      );
      
      // Find relationships where user is parent2
      const parent2Query = query(
        collection(db, 'co_parenting_relationships'),
        where('parent2Id', '==', userData.uid),
        where('status', '==', 'active')
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
      
      // Get parent relationships for children directly
      const childRelationships = await getParentRelationshipsForChildren();
      setCoParentingRelationships([...relationshipIds, ...childRelationships]);
    } catch (error) {
      console.error('Error loading co-parenting relationships:', error);
      toast.error('Erro ao carregar relacionamentos de co-parentalidade');
    }
  };

  // Get all co-parenting relationships for user's children
  const getParentRelationshipsForChildren = async (): Promise<string[]> => {
    if (!userData) return [];
    
    try {
      // First get all of the user's children
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', userData.uid)
      );
      
      const childrenSnapshot = await getDocs(childrenQuery);
      const childIds: string[] = [];
      
      childrenSnapshot.forEach(doc => {
        childIds.push(doc.id);
      });
      
      if (childIds.length === 0) {
        console.log('No children found for this user');
        return [];
      }
      
      console.log('Found children:', childIds);
      
      // For simplicity in this version, we'll just return an empty array
      // This avoids the complex query that might be causing permission issues
      return [];
      
      /* Original implementation that requires more complex permissions:
      // Find all the children that have the same ID but different parents
      const otherParentsChildrenQuery = query(
        collection(db, 'parenting_relationships'),
        where('childId', 'in', childIds),
        where('parentId', '!=', userData.uid)
      );
      
      const otherParentsSnapshot = await getDocs(otherParentsChildrenQuery);
      const otherParentIds: string[] = [];
      
      otherParentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.parentId && !otherParentIds.includes(data.parentId)) {
          otherParentIds.push(data.parentId);
        }
      });
      
      return otherParentIds;
      */
    } catch (error) {
      console.error('Error getting parent relationships:', error);
      return [];
    }
  };

  // Load calendar events
  const loadEvents = async () => {
    try {
      if (!userData) return;
      
      const startOfMonth = currentMonth.startOf('month').subtract(7, 'day');
      const endOfMonth = currentMonth.endOf('month').add(7, 'day');
      
      // Find events for this user, either by:
      // 1. Created by user
      // 2. User is the responsible parent
      
      let eventsRef: CollectionReference<DocumentData> = collection(db, 'calendar_events');
      
      // We'll make two separate queries to simplify our approach
      
      // First query: Events created by the user
      const createdByQuery = query(
        eventsRef,
        where('createdBy', '==', userData.uid),
        where('startTime', '>=', Timestamp.fromDate(startOfMonth.toDate())),
        where('startTime', '<=', Timestamp.fromDate(endOfMonth.toDate()))
      );
      
      // Second query: Events where user is responsible parent
      const responsibleQuery = query(
        eventsRef,
        where('responsibleParentId', '==', userData.uid),
        where('startTime', '>=', Timestamp.fromDate(startOfMonth.toDate())),
        where('startTime', '<=', Timestamp.fromDate(endOfMonth.toDate()))
      );
      
      // Execute both queries
      const [createdBySnapshot, responsibleSnapshot] = await Promise.all([
        getDocs(createdByQuery),
        getDocs(responsibleQuery)
      ]);
      
      // Process results
      const eventsMap = new Map<string, CalendarEventWithChild>(); // Use map to avoid duplicates
      
      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          if (!eventsMap.has(doc.id)) {
            const eventData = doc.data() as CalendarEvent;
            const childInfo = children.find(child => child.id === eventData.childId);
            
            eventsMap.set(doc.id, {
              id: doc.id,
              ...eventData,
              childName: childInfo ? `${childInfo.firstName} ${childInfo.lastName}` : undefined,
              childPhotoURL: childInfo?.photoURL
            });
          }
        });
      };
      
      processSnapshot(createdBySnapshot);
      processSnapshot(responsibleSnapshot);
      
      // Convert map to array
      const eventsData = Array.from(eventsMap.values());
      console.log('Loaded', eventsData.length, 'events');
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erro ao carregar eventos');
    }
  };

  // Create or update an event
  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error('Você precisa estar autenticado para criar eventos');
      return;
    }
    
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }
    
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (startDateTime >= endDateTime) {
        toast.error('A data/hora de início deve ser anterior à data/hora de término');
        return;
      }
      
      const selectedChild = children.find(child => child.id === formData.childId);
      
      // Find co-parenting ID for this child
      let coParentingId = '';
      if (selectedChild) {
        // Here you would typically look up the co-parenting relationship for this child
        // For simplicity, we'll use the first available co-parenting relationship
        coParentingId = coParentingRelationships[0] || '';
      }
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        location: formData.location ? {
          address: formData.location
        } : undefined,
        category: formData.category,
        childId: formData.childId,
        coParentingId,
        responsibleParentId: formData.responsibleParentId,
        checkInRequired: formData.checkInRequired,
        checkInStatus: 'pending',
        createdBy: userData.uid,
        updatedAt: Timestamp.now()
      };
      
      if (isEditMode && selectedEvent) {
        // Update existing event
        await updateDoc(doc(db, 'calendar_events', selectedEvent.id), {
          ...eventData,
          // Preserve creation date and creator
          createdBy: selectedEvent.createdBy,
          createdAt: selectedEvent.createdAt
        });
        
        toast.success('Evento atualizado com sucesso');
      } else {
        // Create new event
        await addDoc(collection(db, 'calendar_events'), {
          ...eventData,
          createdAt: Timestamp.now()
        });
        
        toast.success('Evento criado com sucesso');
      }
      
      // Reset form and close modal
      resetForm();
      setShowEventModal(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  // Delete an event
  const deleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteDoc(doc(db, 'calendar_events', selectedEvent.id));
      toast.success('Evento excluído com sucesso');
      
      // Close modal and reload
      setShowEventModal(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  // Reset the form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: selectedDate.format('YYYY-MM-DD'),
      startTime: '09:00',
      endDate: selectedDate.format('YYYY-MM-DD'),
      endTime: '10:00',
      location: '',
      category: 'other',
      childId: '',
      responsibleParentId: userData?.uid || '',
      checkInRequired: false
    });
    setSelectedEvent(null);
    setIsEditMode(false);
  };

  // Open the modal for creating a new event
  const openNewEventModal = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      startDate: date.format('YYYY-MM-DD'),
      endDate: date.format('YYYY-MM-DD')
    });
    setIsEditMode(false);
    setShowEventModal(true);
  };

  // Open the modal for editing an existing event
  const openEditEventModal = (event: CalendarEventWithChild) => {
    setSelectedEvent(event);
    
    const startDate = dayjs(event.startTime.toDate());
    const endDate = dayjs(event.endTime.toDate());
    
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: startDate.format('YYYY-MM-DD'),
      startTime: startDate.format('HH:mm'),
      endDate: endDate.format('YYYY-MM-DD'),
      endTime: endDate.format('HH:mm'),
      location: event.location?.address || '',
      category: event.category,
      childId: event.childId || '',
      responsibleParentId: event.responsibleParentId,
      checkInRequired: event.checkInRequired
    });
    
    setIsEditMode(true);
    setShowEventModal(true);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };
  
  // Select a date
  const selectDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };
  
  // Get to today
  const goToToday = () => {
    setCurrentMonth(dayjs());
    setSelectedDate(dayjs());
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Get category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'school': return 'bg-blue-500';
      case 'medical': return 'bg-red-500';
      case 'activity': return 'bg-green-500';
      case 'visitation': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">
          Você precisa estar autenticado para acessar o calendário.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-2 sm:p-4">
      <div className="p-2 flex justify-between items-center bg-base-200 rounded-lg mb-2">
        <button 
          onClick={prevMonth}
          className="btn btn-xs sm:btn-sm btn-circle"
        >
          &lt;
        </button>
        <h2 className="text-base sm:text-xl font-semibold">
          {currentMonth.format('MMMM YYYY')}
        </h2>
        <button 
          onClick={nextMonth}
          className="btn btn-xs sm:btn-sm btn-circle"
        >
          &gt;
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <div 
            key={day + index} 
            className="text-center font-medium text-xs text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              h-9 sm:h-12 p-[2px] sm:p-1 border rounded relative flex flex-col
              ${!day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
              ${day.isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
              ${day.isSelected ? 'ring-1 ring-blue-500' : ''}
              hover:bg-gray-50 cursor-pointer
            `}
            onClick={() => selectDate(day.date)}
            onDoubleClick={() => openNewEventModal(day.date)}
          >
            <div className="flex justify-between w-full">
              <span className={`text-xs font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                {day.date.date()}
              </span>
              {day.events.length > 0 && (
                <span className="text-[10px] bg-blue-500 text-white rounded-full h-3 w-3 flex items-center justify-center">
                  {day.events.length}
                </span>
              )}
            </div>
            
            <div className="flex gap-[1px] mt-[1px] flex-wrap">
              {day.events.slice(0, 3).map((event, i) => (
                <div 
                  key={`${event.id}-${i}`}
                  className={`h-1 w-1 sm:h-2 sm:w-2 rounded-full ${getCategoryColor(event.category)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditEventModal(event);
                  }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="py-2 border-t mt-2 flex justify-between items-center">
        <button 
          onClick={goToToday}
          className="btn btn-xs btn-primary"
        >
          Hoje
        </button>
        <button
          onClick={() => openNewEventModal(selectedDate)}
          className="btn btn-xs btn-accent"
        >
          Novo Evento
        </button>
      </div>
      
      {/* Events for selected date */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold mb-2 flex justify-between items-center">
          <span>Eventos: {selectedDate.format('DD/MM/YYYY')}</span>
          <button
            onClick={() => openNewEventModal(selectedDate)}
            className="btn btn-xs btn-circle btn-ghost"
          >
            +
          </button>
        </h3>
        
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {calendarDays.find(day => day.isSelected)?.events.length === 0 ? (
            <div className="text-xs text-gray-500 text-center p-2">
              Nenhum evento para esta data
            </div>
          ) : (
            calendarDays.find(day => day.isSelected)?.events.map((event) => (
              <div 
                key={event.id} 
                className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => openEditEventModal(event)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    <p className="text-xs text-gray-600">
                      {dayjs(event.startTime.toDate()).format('HH:mm')} - {dayjs(event.endTime.toDate()).format('HH:mm')}
                    </p>
                    {event.childName && (
                      <p className="text-xs text-gray-600">
                        {event.childName}
                      </p>
                    )}
                  </div>
                  <span className={`badge badge-xs ${getCategoryColor(event.category)} text-white`}>
                    {event.category === 'school' ? 'Escola' : 
                     event.category === 'medical' ? 'Médico' : 
                     event.category === 'activity' ? 'Ativ.' : 
                     event.category === 'visitation' ? 'Visita' : 'Outros'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="modal-box p-3 w-full max-w-md bg-white rounded-lg shadow-lg h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-3 flex justify-between items-center">
              <span>{isEditMode ? 'Editar Evento' : 'Novo Evento'}</span>
              <button 
                type="button"
                className="btn btn-sm btn-circle"
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </h3>
            
            <form onSubmit={saveEvent} className="space-y-2">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Título</span>
                </label>
                <input 
                  type="text"
                  name="title"
                  className="input input-bordered input-sm w-full"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Descrição</span>
                </label>
                <textarea 
                  name="description"
                  className="textarea textarea-bordered textarea-sm w-full"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label py-1">
                    <span className="label-text text-xs">Data de Início</span>
                  </label>
                  <input 
                    type="date"
                    name="startDate"
                    className="input input-bordered input-sm w-full"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="label py-1">
                    <span className="label-text text-xs">Hora de Início</span>
                  </label>
                  <input 
                    type="time"
                    name="startTime"
                    className="input input-bordered input-sm w-full"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label py-1">
                    <span className="label-text text-xs">Data de Término</span>
                  </label>
                  <input 
                    type="date"
                    name="endDate"
                    className="input input-bordered input-sm w-full"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="label py-1">
                    <span className="label-text text-xs">Hora de Término</span>
                  </label>
                  <input 
                    type="time"
                    name="endTime"
                    className="input input-bordered input-sm w-full"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Local</span>
                </label>
                <input 
                  type="text"
                  name="location"
                  className="input input-bordered input-sm w-full"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="Endereço ou nome do local"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Categoria</span>
                  </label>
                  <select 
                    name="category"
                    className="select select-bordered select-sm w-full"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="school">Escola</option>
                    <option value="medical">Médico</option>
                    <option value="activity">Atividade</option>
                    <option value="visitation">Visita</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Criança</span>
                  </label>
                  <select 
                    name="childId"
                    className="select select-bordered select-sm w-full"
                    value={formData.childId}
                    onChange={handleFormChange}
                  >
                    <option value="">Selecione</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Responsável</span>
                </label>
                <select 
                  name="responsibleParentId"
                  className="select select-bordered select-sm w-full"
                  value={formData.responsibleParentId}
                  onChange={handleFormChange}
                  required
                >
                  <option value={userData.uid}>Eu ({userData.firstName})</option>
                  {/* Here you would typically add options for co-parents */}
                </select>
              </div>
              
              <div className="form-control">
                <label className="label py-1 cursor-pointer justify-start gap-2">
                  <input 
                    type="checkbox"
                    name="checkInRequired"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={formData.checkInRequired}
                    onChange={handleFormChange}
                  />
                  <span className="label-text text-xs">Exigir check-in</span>
                </label>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                {isEditMode && (
                  <button 
                    type="button"
                    className="btn btn-error btn-sm"
                    onClick={deleteEvent}
                  >
                    Excluir
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button 
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setShowEventModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary btn-sm"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}