// components/ModernWeekCalendar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUser } from '@context/userContext';
import Image from 'next/image';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { CalendarEvent } from '@/types/shared.types';
import toast from 'react-hot-toast';

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
    events?: CalendarEventWithChild[];
    onDateSelect?: (date: Dayjs) => void;
    selectedDate?: Dayjs;
}

const ModernWeekCalendar: React.FC<ModernWeekCalendarProps> = ({
    events = [],
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
                const processSnapshot = (snapshot: any) => {
                    snapshot.forEach((doc: any) => {
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

    // Helper functions
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
                <button
                    onClick={prevWeek}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    aria-label="Previous week"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-lg text-gray-800">
                        {weekDays.length > 0 ? `${weekDays[0].date.format('MMM D')} - ${weekDays[6].date.format('MMM D, YYYY')}` : ''}
                    </h2>
                </div>

                <button
                    onClick={nextWeek}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    aria-label="Next week"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, index) => (
                    <div
                        key={index}
                        onClick={() => handleDaySelect(day)}
                        className={`
                            flex flex-col items-center p-3 rounded-lg transition-all cursor-pointer
                            ${day.isToday
                                ? 'bg-indigo-50 border-indigo-200 border'
                                : day.isSelected
                                    ? 'bg-indigo-100 border-indigo-300 border'
                                    : 'hover:bg-gray-50'}
                        `}
                    >
                        {/* Day Name */}
                        <span className="text-xs text-gray-500 font-medium mb-1">
                            {day.dayName[0].toUpperCase()}
                        </span>

                        {/* Day Number */}
                        <span className={
                            `flex items-center justify-center w-10 h-10 rounded-full mb-1 font-nunito text-2xl font-semibold 
                            ${day.isToday
                                ? 'bg-purpleShade04 text-white'
                                : day.isSelected && !day.isToday
                                    ? 'bg-indigo-400 text-white'
                                    : 'text-gray-800'
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
                                    <span className="text-xs text-gray-500">
                                        +{day.events.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Today's Events */}
            <div className="">
                <h3 className="text-lg mb-3 font-playfair font-semibold">
                    Eventos de Hoje {isLoading && <span className="loading loading-spinner loading-xs ml-2"></span>}
                </h3>
                {todayEvents.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 bg-base-200 rounded-lg text-center">
                        Nenhum evento agendado para hoje
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayEvents.map(event => (
                            <div key={event.id} className="p-3 bg-base-200 rounded-lg">
                                <div className="flex items-center mb-1">
                                    <span className="text-lg mr-2">{getCategoryIcon(event.category)}</span>
                                    <h4 className="text-base font-medium flex-1">{event.title}</h4>
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-purpleShade01 text-purpleShade04">
                                        {dayjs(event.startTime.toDate()).format('HH:mm')}
                                    </span>
                                </div>
                                {event.description && (
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                )}
                                {event.location?.address && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                                        <span className="mr-1">📍</span>
                                        {event.location.address}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Events */}
            <div className="mt-2">
                <h3 className="text-lg mb-3 font-playfair font-semibold">
                    Próximos Eventos
                </h3>
                {upcomingEvents.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 bg-base-200 rounded-lg text-center">
                        Nenhum evento agendado para os próximos dias
                    </div>
                ) : (
                    <div className="">
                        {upcomingEvents.slice(0, 5).map(event => (
                            <div key={event.id} className="p-3 bg-base-200 rounded-lg">
                                <div className="flex flex-row items-start">
                                    {/* category icon */}
                                    <span className="text-lg mr-2">{getCategoryIcon(event.category)}</span>
                                    {/* event info */}
                                    <div className='flex flex-col flex-1 justify-between'>
                                        <div className="flex flex-row items-start">
                                            <h4 className="text-base font-medium flex-1 font-raleway">
                                                {event.title}
                                            </h4>
                                            <div className="text-right">
                                                <div className="text-xs font-bold">
                                                    {dayjs(event.startTime.toDate()).format('DD/MM')}
                                                </div>
                                                <div className="text-xs">
                                                    {dayjs(event.startTime.toDate()).format('HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                        {/* description */}
                                        {event.description && (
                                            <p className="text-sm text-gray-600 line-clamp-1">
                                                {event.description}
                                            </p>
                                        )}
                                        {/* location */}
                                        <div className="text-xs text-gray-500">
                                            {dayjs(event.startTime.toDate()).fromNow()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {upcomingEvents.length > 5 && (
                            <div className="text-center text-sm text-purpleShade04 mt-2">
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