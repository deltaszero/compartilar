"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/context/userContext';
import {
    startOfMonth,
    endOfMonth,
    subDays,
    addDays,
    isSameDay,
    addWeeks,
    startOfWeek,
    endOfWeek,
    format
} from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { DayEvents } from './DayEvents';
import { EventForm } from './EventForm';
import { CalendarFilters } from './CalendarFilters';
import { Button } from "@/components/ui/button";
import { CalendarProps, CalendarEventWithChild, EventFormData, UserPermission } from './types';
import { useToast } from '@/hooks/use-toast';
import {
    fetchChildren,
    fetchCoParentingRelationships,
    generateCalendarDays,
    fetchEventHistory
} from './calendar-service';

export default function Calendar({ initialMonth, view: initialView }: CalendarProps) {
    const { user, userData } = useUser();
    const { toast } = useToast();

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>(initialView || 'month');

    // Data state
    const [children, setChildren] = useState<any[]>([]);
    const [coParentingRelationships, setCoParentingRelationships] = useState<string[]>([]);
    const [events, setEvents] = useState<CalendarEventWithChild[]>([]);
    const [calendarDays, setCalendarDays] = useState<{ date: Date; isCurrentMonth: boolean; isToday: boolean; events: CalendarEventWithChild[]; isSelected: boolean; }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter state
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Event form state
    const [showEventForm, setShowEventForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithChild | undefined>(undefined);

    // Load children and relationships with better error handling
    // Function to fetch children directly from API
    const fetchChildrenAPI = useCallback(async () => {
        if (!user || !userData) return [];

        try {
            const token = await user.getIdToken(true);
            const userId = userData.uid;

            // Use the profile/children endpoint with required parameters
            const response = await fetch(`/api/profile/children?userId=${userId}&currentUserId=${userId}&relationshipStatus=none`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-requested-with': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch children');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching children from API:', error);
            return [];
        }
    }, [user, userData]);

    useEffect(() => {
        if (!user || !userData) return;

        const loadInitialData = async () => {
            let childrenData = [];
            let relationships = [];

            // Load children with separate try-catch for better error identification
            try {
                // Try to use the API first, fall back to client-side if needed
                childrenData = await fetchChildrenAPI();

                // If that fails, fall back to the existing function
                if (childrenData.length === 0) {
                    childrenData = await fetchChildren(userData.uid);
                }

                // Initialize selected children to all children by default
                if (childrenData.length > 0 && selectedChildren.length === 0) {
                    setSelectedChildren(childrenData.map((child: { id: string }) => child.id));
                }

                setChildren(childrenData);
            } catch (error) {
                // Silent catch - no need to show errors about missing children
            }

            // Load relationships with separate try-catch
            try {
                relationships = await fetchCoParentingRelationships(userData.uid);
                setCoParentingRelationships(relationships);
            } catch (error) {
                // Silent catch - no need to show errors about missing relationships
            }
        };

        loadInitialData();
    }, [user, userData, fetchChildrenAPI, selectedChildren.length]);

    // Calculate date range based on current view
    const dateRange = useMemo(() => {
        let startDate, endDate;

        switch (calendarView) {
            case 'month':
                // For month view, include previous and next month days for complete weeks
                startDate = subDays(startOfMonth(currentMonth), 7);
                endDate = addDays(endOfMonth(currentMonth), 7);
                break;

            case 'week':
                // For week view, just the current week
                startDate = startOfWeek(currentMonth);
                endDate = endOfWeek(currentMonth);
                break;

            case 'day':
                // For day view, just the current day
                startDate = currentMonth;
                endDate = currentMonth;
                break;

            case 'agenda':
                // For agenda view, two weeks
                startDate = currentMonth;
                endDate = addWeeks(currentMonth, 2);
                break;

            default:
                startDate = subDays(startOfMonth(currentMonth), 7);
                endDate = addDays(endOfMonth(currentMonth), 7);
        }

        return { startDate, endDate };
    }, [currentMonth, calendarView]);

    // New function to fetch events from the API
    const fetchEventsFromAPI = useCallback(async (childId: string, startDate: Date, endDate: Date) => {
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            const token = await user.getIdToken(true);

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            const response = await fetch(
                `/api/children/${childId}/calendar?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-requested-with': 'XMLHttpRequest'
                    }
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch events');
            }

            const result = await response.json();
            return result.events || [];
        } catch (error) {
            console.error('Error fetching events from API:', error);
            return [];
        }
    }, [user]);

    // Load events when month changes or filters change - with better error handling
    useEffect(() => {
        if (!user) return;

        // Skip loading if there are no children to fetch events for
        if (children.length === 0) {
            setEvents([]);
            setLoading(false);
            return;
        }

        const loadEvents = async () => {
            setLoading(true);

            try {
                // Filter children by selected children filter
                const filteredChildren = selectedChildren.length > 0
                    ? children.filter(child => selectedChildren.includes(child.id))
                    : children;

                if (filteredChildren.length === 0) {
                    setEvents([]);
                    return;
                }

                // Fetch events for each child in parallel
                const eventPromises = filteredChildren.map(child =>
                    fetchEventsFromAPI(child.id, dateRange.startDate, dateRange.endDate)
                );

                const eventsArrays = await Promise.all(eventPromises);

                // Flatten the arrays and enrich with child data
                let allEvents = eventsArrays.flat().map(event => {
                    const child = children.find(c => c.id === event.childId);
                    return {
                        ...event,
                        childName: child?.name || 'Unknown',
                        childPhotoURL: child?.photoURL,
                        // Convert string dates back to Date objects
                        startDate: {
                            toDate: () => new Date(event.startDate)
                        },
                        endDate: {
                            toDate: () => new Date(event.endDate)
                        },
                        canEdit: true // API handles permission checks server-side
                    };
                });

                // Apply category filters if any
                if (selectedCategories.length > 0) {
                    allEvents = allEvents.filter(event =>
                        event.category && selectedCategories.includes(event.category)
                    );
                }

                setEvents(allEvents);
            } catch (error) {
                // Handle errors silently - the calendar should still be usable
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [user, dateRange, children, selectedChildren, selectedCategories, fetchEventsFromAPI]);

    // Generate calendar days - prevent updates during event form operations
    useEffect(() => {
        if (!showEventForm) {
            const days = generateCalendarDays(currentMonth, selectedDate, events);
            setCalendarDays(days);
        }
    }, [currentMonth, selectedDate, events, showEventForm]);

    // Navigation functions
    const handlePrevMonth = useCallback(() => {
        const firstDayOfMonth = startOfMonth(currentMonth);
        const prevMonth = subDays(firstDayOfMonth, 1);
        setCurrentMonth(prevMonth);
    }, [currentMonth]);

    const handleNextMonth = useCallback(() => {
        const lastDayOfMonth = endOfMonth(currentMonth);
        const nextMonth = addDays(lastDayOfMonth, 1);
        setCurrentMonth(nextMonth);
    }, [currentMonth]);

    const handleTodayClick = useCallback(() => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(today);
    }, []);

    // View change handler
    const handleViewChange = useCallback((view: 'month' | 'week' | 'day' | 'agenda') => {
        setCalendarView(view);
    }, []);

    // Date selection
    const handleSelectDate = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    // Filter handlers
    const handleChildFilterChange = useCallback((childIds: string[]) => {
        setSelectedChildren(childIds);
    }, []);

    const handleCategoryFilterChange = useCallback((categories: string[]) => {
        setSelectedCategories(categories);
    }, []);

    // Event form handling
    const handleAddEvent = useCallback((date: Date) => {
        setSelectedDate(currentSelectedDate => {
            return (currentSelectedDate && isSameDay(currentSelectedDate, date))
                ? currentSelectedDate
                : date;
        });

        setSelectedEvent(undefined);
        setShowEventForm(true);
    }, []);

    const handleEditEvent = useCallback((date: Date, event: CalendarEventWithChild) => {
        setSelectedDate(date);
        setSelectedEvent(event);
        setShowEventForm(true);
    }, []);

    // New function to delete events via API
    const handleDeleteEvent = useCallback(async (eventId: string) => {
        if (!user || !selectedEvent?.childId) return;

        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        setIsSubmitting(true);

        try {
            const token = await user.getIdToken(true);
            const childId = selectedEvent.childId;

            const response = await fetch(
                `/api/children/${childId}/calendar/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-requested-with': 'XMLHttpRequest'
                    }
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete event');
            }

            // Update events list by removing the deleted event
            setEvents(prev => prev.filter(event => event.id !== eventId));

            toast({
                title: "Evento excluído",
                description: "O evento foi excluído com sucesso",
            });
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível excluir o evento",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [user, selectedEvent, toast]);

    // New function to save events via API
    const handleSaveEvent = useCallback(async (formData: EventFormData) => {
        if (!user) return;

        setIsSubmitting(true);

        try {
            const token = await user.getIdToken(true);

            const childId = formData.childId;
            const method = selectedEvent ? 'PATCH' : 'POST';
            const url = selectedEvent
                ? `/api/children/${childId}/calendar/events/${selectedEvent.id}`
                : `/api/children/${childId}/calendar`;

            // Format date and time for API
            const startDate = `${formData.startDate}T${formData.startTime}:00`;
            const endDate = `${formData.endDate}T${formData.endTime}:00`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-requested-with': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    ...formData,
                    startDate,
                    endDate
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save event');
            }

            const result = await response.json();

            // Refresh events for all selected children
            const eventPromises = selectedChildren.map(childId =>
                fetchEventsFromAPI(childId, dateRange.startDate, dateRange.endDate)
            );

            const eventsArrays = await Promise.all(eventPromises);

            // Flatten the arrays and enrich with child data
            const allEvents = eventsArrays.flat().map(event => {
                const child = children.find(c => c.id === event.childId);
                return {
                    ...event,
                    childName: child?.name || 'Unknown',
                    childPhotoURL: child?.photoURL,
                    // Convert string dates back to Date objects
                    startDate: {
                        toDate: () => new Date(event.startDate)
                    },
                    endDate: {
                        toDate: () => new Date(event.endDate)
                    },
                    canEdit: true // API handles permission checks server-side
                };
            });

            setEvents(allEvents);
            setShowEventForm(false);

            toast({
                title: selectedEvent ? "Evento atualizado" : "Evento criado",
                description: selectedEvent
                    ? "O evento foi atualizado com sucesso"
                    : "O evento foi criado com sucesso"
            });
        } catch (error: any) {
            console.error('Error saving event:', error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível salvar o evento",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [user, selectedEvent, dateRange, children, selectedChildren, toast, fetchEventsFromAPI]);

    if (!userData) {
        return (
            <div className="p-6 text-center border-4 border-black shadow-brutalist bg-white">
                <p className="text-lg">Please log in to view the calendar</p>
            </div>
        );
    }

    // Filter events for the selected day, with error handling
    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];

        try {
            return events.filter(event => {
                try {
                    // Use try-catch to handle any malformed dates
                    const eventDate = event.startDate.toDate();
                    return isSameDay(eventDate, selectedDate);
                } catch (err) {
                    console.error('Error parsing event date:', err);
                    return false;
                }
            });
        } catch (error) {
            console.error('Error filtering events:', error);
            return [];
        }
    }, [selectedDate, events]);

    // Handle case where user has no children or not enough permissions
    if (children.length === 0 && !loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 border-2 border-black shadow-brutalist rounded-none text-center">
                    <h1 className="text-xl font-bold mb-4">
                        Calendário Compartilhado
                    </h1>
                    <p className="mb-4">Você ainda não tem crianças cadastradas no sistema.</p>
                    <p className="text-sm text-gray-600 mb-6">
                        Para usar o calendário compartilhado, você precisa adicionar uma criança ao sistema primeiro.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => {
                                // Navigate to add child page
                                if (userData) {
                                    window.location.href = `/${userData.uid}/criancas/adicionar`;
                                }
                            }}
                            className="bg-main"
                        >
                            Adicionar uma Criança
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Navigate to dashboard
                                if (userData) {
                                    window.location.href = `/${userData.uid}`;
                                }
                            }}
                        >
                            Voltar para Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Normal calendar view
    return (
        <div className="flex flex-col gap-4">
            <div className='grid grid-cols-1 md:grid-cols-3 gap-0 space-y-4 sm:gap-4 sm:space-y-0'>
                <div className='col-span-2 flex flex-col gap-4'>
                    <CalendarHeader
                        currentMonth={currentMonth}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onTodayClick={handleTodayClick}
                        view={calendarView}
                        onViewChange={handleViewChange}
                    />

                    <CalendarFilters
                        children={children}
                        selectedChildren={selectedChildren}
                        onChildFilterChange={handleChildFilterChange}
                        selectedCategories={selectedCategories}
                        onCategoryFilterChange={handleCategoryFilterChange}
                    />

                    <CalendarGrid
                        days={calendarDays}
                        onSelectDate={handleSelectDate}
                        onDoubleClick={handleAddEvent}
                        isLoading={loading}
                    />
                </div>

                <div>
                    <DayEvents
                        selectedDate={selectedDate}
                        events={selectedDayEvents}
                        onAddEvent={handleAddEvent}
                        onEditEvent={handleEditEvent}
                        onDeleteEvent={handleDeleteEvent}
                        isLoading={loading}
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
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}