// components/ModernWeekCalendar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUser } from '@context/userContext';
import { collection, query, where, getDocs, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { CalendarEvent } from '@/types/shared.types';
import toast from 'react-hot-toast';

// shadcn imports
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Add required plugins
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(relativeTime);

// Enhanced Event interface
interface CalendarEventWithChild extends CalendarEvent {
    childName?: string;
    childPhotoURL?: string;
}

interface DayInfo {
    date: Dayjs;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    isSelected: boolean;
    events: CalendarEventWithChild[];
}

interface ModernWeekCalendarProps {
    onDateSelect?: (date: Dayjs) => void;
    selectedDate?: Dayjs;
}

const ModernWeekCalendar: React.FC<ModernWeekCalendarProps> = ({
    onDateSelect,
    selectedDate,
}) => {
    const { userData } = useUser();
    const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
    const [currentDate, setCurrentDate] = useState<Dayjs>(selectedDate || dayjs());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEventWithChild[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load calendar events
    useEffect(() => {
        const loadEvents = async () => {
            if (!userData) return;

            setIsLoading(true);
            try {
                const startOfWeek = currentDate.startOf('week').toDate();
                const endOfNextWeek = currentDate.add(14, 'day').endOf('day').toDate();

                const eventsRef = collection(db, 'calendar_events');

                // Get events created by this user
                const createdByQuery = query(
                    eventsRef,
                    where('createdBy', '==', userData.uid)
                );

                // Get events where user is responsible parent
                const responsibleQuery = query(
                    eventsRef,
                    where('responsibleParentId', '==', userData.uid)
                );

                const [createdBySnapshot, responsibleSnapshot] = await Promise.all([
                    getDocs(createdByQuery),
                    getDocs(responsibleQuery)
                ]);

                const eventsMap = new Map<string, CalendarEventWithChild>();

                // Process results and filter by date range in memory
                const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
                    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                        if (!eventsMap.has(doc.id)) {
                            const eventData = doc.data() as CalendarEvent;

                            // Filter by date range
                            const eventStartTime = eventData.startTime.toDate();
                            if (eventStartTime >= startOfWeek && eventStartTime <= endOfNextWeek) {
                                eventsMap.set(doc.id, {
                                    ...eventData,
                                    childName: eventData.childId ? 'Criança' : undefined,
                                });
                            }
                        }
                    });
                };

                processSnapshot(createdBySnapshot);
                processSnapshot(responsibleSnapshot);

                const eventsArray = Array.from(eventsMap.values());
                setCalendarEvents(eventsArray);
            } catch (error) {
                console.error('Error loading events:', error);
                toast.error('Erro ao carregar eventos');
            } finally {
                setIsLoading(false);
            }
        };

        loadEvents();
    }, [userData, currentDate]);

    // Generate week days
    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    }, [selectedDate]);

    useEffect(() => {
        const weekStart = currentDate.startOf('week');
        const days: DayInfo[] = [];

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');

            // Filter events for this day
            const dayEvents = calendarEvents.filter(event => {
                const eventDate = dayjs(event.startTime.toDate());
                return eventDate.isSame(currentDay, 'day');
            });

            days.push({
                date: currentDay,
                dayName: currentDay.format('ddd'),
                dayNumber: currentDay.date(),
                isToday: currentDay.isSame(dayjs(), 'day'),
                isSelected: currentDay.isSame(selectedDate || currentDate, 'day'),
                events: dayEvents
            });
        }

        setWeekDays(days);
    }, [currentDate, calendarEvents, selectedDate]);

    // Navigate to previous week
    const prevWeek = () => {
        const newDate = currentDate.subtract(1, 'week');
        setCurrentDate(newDate);
        if (onDateSelect) {
            onDateSelect(newDate);
        }
    };

    // Navigate to next week
    const nextWeek = () => {
        const newDate = currentDate.add(1, 'week');
        setCurrentDate(newDate);
        if (onDateSelect) {
            onDateSelect(newDate);
        }
    };

    // Handle day selection
    const handleDaySelect = (day: DayInfo) => {
        if (onDateSelect) {
            onDateSelect(day.date);
        }
    };

    // Helper functions for event categories
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'school':
                return 'bg-blue-500';
            case 'medical':
                return 'bg-red-500';
            case 'activity':
                return 'bg-green-500';
            case 'visitation':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'school':
                return '🏫';
            case 'medical':
                return '🏥';
            case 'activity':
                return '🎯';
            case 'visitation':
                return '👨‍👧‍👦';
            default:
                return '📌';
        }
    };

    // Get today's and upcoming events
    const todayEvents = calendarEvents
        .filter(event => dayjs(event.startTime.toDate()).isSame(dayjs(), 'day'))
        .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime());

    const upcomingEvents = calendarEvents
        .filter(event => {
            const eventDate = dayjs(event.startTime.toDate());
            return eventDate.isAfter(dayjs(), 'day') && eventDate.isBefore(dayjs().add(14, 'day'));
        })
        .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime());

    return (
        <div className="font-sans w-full max-w-2xl mx-auto">
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-6">
                <Button 
                    onClick={prevWeek} 
                    variant="ghost" 
                    size="icon"
                    aria-label="Previous week"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="text-center">
                    <h2 className="text-lg font-medium">
                        {weekDays.length > 0 ? `${weekDays[0].date.format('MMM D')} - ${weekDays[6].date.format('MMM D, YYYY')}` : ''}
                    </h2>
                </div>

                <Button 
                    onClick={nextWeek} 
                    variant="ghost" 
                    size="icon"
                    aria-label="Next week"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-6">
                {weekDays.map((day, index) => (
                    <Button
                        key={index}
                        onClick={() => handleDaySelect(day)}
                        variant="ghost"
                        className={`
                            h-auto flex flex-col items-center py-3 px-1 rounded-lg
                            ${day.isToday ? 'bg-primary/10 hover:bg-primary/15' : 
                              day.isSelected ? 'bg-primary/20 hover:bg-primary/25' : ''}
                        `}
                    >
                        {/* Day Name */}
                        <span className="text-xs text-muted-foreground font-medium mb-1">
                            {day.dayName[0].toUpperCase()}
                        </span>

                        {/* Day Number */}
                        <span className={`
                            flex items-center justify-center w-8 h-8 rounded-full mb-1 font-medium
                            ${day.isToday
                                ? 'bg-primary text-primary-foreground'
                                : day.isSelected && !day.isToday
                                    ? 'bg-primary/50 text-primary-foreground'
                                    : ''
                            }
                        `}>
                            {day.dayNumber}
                        </span>

                        {/* Event Badges */}
                        {day.events.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mt-1 w-full">
                                {day.events.slice(0, 3).map((event, i) => (
                                    <span
                                        key={event.id || i}
                                        className={`block w-2 h-2 rounded-full ${getCategoryColor(event.category)}`}
                                    />
                                ))}
                                {day.events.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{day.events.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </Button>
                ))}
            </div>

            {/* Today's Events */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    Eventos de Hoje 
                    {isLoading && (
                        <Skeleton className="h-4 w-4 rounded-full ml-2" />
                    )}
                </h3>
                
                {todayEvents.length === 0 ? (
                    <Card>
                        <CardContent className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum evento agendado para hoje
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {todayEvents.map(event => (
                            <Card key={event.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center mb-1">
                                        <span className="text-lg mr-2">{getCategoryIcon(event.category)}</span>
                                        <h4 className="text-base font-medium flex-1">{event.title}</h4>
                                        <Badge variant="outline" className="ml-2">
                                            {dayjs(event.startTime.toDate()).format('HH:mm')}
                                        </Badge>
                                    </div>
                                    
                                    {event.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                    )}
                                    
                                    {event.location?.address && (
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                            <span className="mr-1">📍</span>
                                            {event.location.address}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Events */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Próximos Eventos
                </h3>
                
                {upcomingEvents.length === 0 ? (
                    <Card>
                        <CardContent className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum evento agendado para os próximos dias
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.slice(0, 5).map(event => (
                            <Card key={event.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-row items-start">
                                        {/* category icon */}
                                        <span className="text-lg mr-2">{getCategoryIcon(event.category)}</span>
                                        
                                        {/* event info */}
                                        <div className='flex flex-col flex-1 justify-between'>
                                            <div className="flex flex-row items-start">
                                                <h4 className="text-base font-medium flex-1">
                                                    {event.title}
                                                </h4>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="ml-2">
                                                        {dayjs(event.startTime.toDate()).format('DD/MM HH:mm')}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            {/* description */}
                                            {event.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {event.description}
                                                </p>
                                            )}
                                            
                                            {/* relative time */}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {dayjs(event.startTime.toDate()).fromNow()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {upcomingEvents.length > 5 && (
                            <div className="text-center text-sm text-primary mt-2">
                                + {upcomingEvents.length - 5} eventos futuros
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModernWeekCalendar;