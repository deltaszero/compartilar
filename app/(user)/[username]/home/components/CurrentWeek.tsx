"use client";
import { useState, useEffect, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WeekDay } from "../types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"; // import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useUser } from "@/context/userContext";
import Image from "next/image";
// import { Badge } from "@/components/ui/badge";
import { isSameDay } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchChildren } from "../../calendario/components/calendar-service";
import { CalendarEventWithChild } from "../../calendario/components/types";

interface CurrentWeekProps {
    selectedDate: Dayjs;
    onDateSelect: (date: Dayjs) => void;
}

export const CurrentWeek = ({ selectedDate, onDateSelect }: CurrentWeekProps) => {
    const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
    const [events, setEvents] = useState<CalendarEventWithChild[]>([]);
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const { user, userData } = useUser();
    const params = useParams();
    const username = params.username as string;

    // Function to fetch children from API
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

    // Function to fetch events from API
    const fetchEventsAPI = useCallback(async (childId: string, startDate: Date, endDate: Date) => {
        if (!user) return [];
        
        try {
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

    // Load children and events
    useEffect(() => {
        if (!user || !userData) return;

        const loadEvents = async () => {
            setLoading(true);
            try {
                // Fetch children first via API
                const childrenData = await fetchChildrenAPI();
                
                // If that fails, fall back to the existing function
                let finalChildrenData = childrenData;
                if (childrenData.length === 0) {
                    finalChildrenData = await fetchChildren(userData.uid);
                }
                
                setChildren(finalChildrenData);

                // Calculate date range for the entire week with buffer
                const weekStart = selectedDate.startOf('week').subtract(1, 'day').toDate();
                const weekEnd = selectedDate.endOf('week').add(1, 'day').toDate();

                // Fetch events for each child in parallel using the API
                let allEvents: CalendarEventWithChild[] = [];
                
                if (finalChildrenData.length > 0) {
                    const eventPromises = finalChildrenData.map((child: { id: string }) => 
                        fetchEventsAPI(child.id, weekStart, weekEnd)
                    );
                    
                    const eventsArrays = await Promise.all(eventPromises);
                    
                    // Flatten and enrich with child data
                    allEvents = eventsArrays.flat().map(event => {
                        const child = finalChildrenData.find((c: { id: string }) => c.id === event.childId);
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
                }

                setEvents(allEvents);
            } catch (error) {
                console.error('Error loading weekly events:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [user, userData, selectedDate, fetchChildrenAPI, fetchEventsAPI]);

    // Generate week days
    useEffect(() => {
        const weekStart = selectedDate.startOf('week');
        const days = [];

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');

            // Count events for this day 
            const dayEvents = events.filter(event => {
                const eventDate = event.startDate.toDate();
                return isSameDay(eventDate, currentDay.toDate());
            });

            days.push({
                date: currentDay,
                dayName: currentDay.format('ddd'),
                dayNumber: currentDay.date(),
                isToday: currentDay.isSame(dayjs(), 'day'),
                isSelected: currentDay.isSame(selectedDate, 'day'),
                eventCount: dayEvents.length
            });
        }

        setWeekDays(days);
    }, [selectedDate, events]);

    // Navigate to previous week
    const prevWeek = () => {
        const newDate = selectedDate.subtract(1, 'week');
        onDateSelect(newDate);
    };

    // Navigate to next week
    const nextWeek = () => {
        const newDate = selectedDate.add(1, 'week');
        onDateSelect(newDate);
    };

    // Handle day selection
    const handleDaySelect = (day: { date: Dayjs }) => {
        onDateSelect(day.date);
    };

    // Get events for the selected day
    const selectedDayEvents = events.filter(event => {
        const eventDate = event.startDate.toDate();
        return isSameDay(eventDate, selectedDate.toDate());
    });

    // Get upcoming events (next 3 days excluding today)
    const today = dayjs();
    const upcomingEvents = events
        .filter(event => {
            const eventDate = event.startDate.toDate();
            const eventDay = dayjs(eventDate);
            return eventDay.isAfter(today, 'day') && eventDay.diff(today, 'day') <= 3;
        })
        .sort((a, b) => a.startDate.toDate().getTime() - b.startDate.toDate().getTime())
        .slice(0, 3);

    // Category colors for events
    const categoryColors = {
        school: 'bg-blue-500',
        medical: 'bg-red-500',
        activity: 'bg-green-500',
        visitation: 'bg-purple-500',
        other: 'bg-gray-500'
    };

    return (
        <div className="font-sans w-full max-w-2xl mx-auto">
            <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Week Navigation */}
                <div className="flex justify-between items-center mb-4">
                    <Button
                        onClick={prevWeek}
                        variant="outline"
                        size="icon"
                        aria-label="Previous week"
                        className="bg-bw"
                    >
                        <ChevronLeft/>
                    </Button>

                    <div className="text-center relative">
                        <h2 className="text-xl font-bold tracking-tight pb-1 px-2 font-raleway">
                            {weekDays.length > 0 ? `${weekDays[0].date.format('MMM D')} - ${weekDays[6].date.format('MMM D, YYYY')}` : ''}
                        </h2>
                    </div>

                    <Button
                        onClick={nextWeek}
                        variant="outline"
                        size="icon"
                        aria-label="Next week"
                        className="bg-bw"
                    >
                        <ChevronRight/>
                    </Button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 mb-4">
                    {weekDays.map((day, index) => (
                        <Button
                            key={index}
                            onClick={() => handleDaySelect(day)}
                            variant={null}
                            className={`h-auto flex flex-col items-center
                                ${day.isSelected ? 'bg-bg' : ''}
                                    ${day.isToday 
                                        ? ''
                                        : day.isSelected && !day.isToday
                                            ? ''
                                            : ''
                                    }
                            `}
                        >
                            {/* Event dot indicator */}
                            {(day.eventCount ?? 0) > 0 && (
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-black"></div>
                            )}

                            {/* Day Name */}
                            <span className="text-sm mb-1 font-black font-raleway">
                                {day.dayName[0].toUpperCase()}
                            </span>

                            {/* Day Number */}
                            <span className={`flex items-center justify-center w-7 h-7 font-bold font-raleway
                                ${day.isToday
                                    ? 'bg-black text-white'
                                    : day.isSelected && !day.isToday
                                        ? 'text-black'
                                        : ''
                                }
                                ${day.isToday || (day.isSelected && !day.isToday) ? '' : ''}`}
                            >
                                {day.dayNumber}
                            </span>
                        </Button>
                    ))}
                </div>

                {/* Day Events Section */}
                <div className="mt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-raleway font-bold">
                            {selectedDate
                                ? format(selectedDate.toDate(), "d 'de' MMMM", { locale: ptBR })
                                : "Selecione uma data"}
                        </h3>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onDateSelect(dayjs())}
                            className="px-4 text-md font-semibold font-raleway"
                        >
                            <span>
                                Hoje
                            </span>
                        </Button>
                    </div>

                    {/* List of events for selected day */}
                    {selectedDayEvents.length === 0 ? (
                        <p className="text-xs text-gray-500 italic font-nunito">
                            Nenhum evento para este dia
                        </p>
                    ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {selectedDayEvents.map((event) => (
                                <div key={event.id} className="py-1 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${categoryColors[event.category || 'other']}`}></div>
                                        <span className="text-xs font-medium text-gray-500">
                                            {format(event.startDate.toDate(), 'HH:mm')}
                                        </span>
                                        <span className="text-xs font-bold truncate">{event.title}</span>

                                        {event.childName && (
                                            <div className="flex items-center ml-auto">
                                                {event.childPhotoURL ? (
                                                    <div className="w-3 h-3 rounded-full overflow-hidden border border-gray-300">
                                                        <Image
                                                            src={event.childPhotoURL}
                                                            alt={event.childName}
                                                            width={12}
                                                            height={12}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Events Section */}
                <div className="mt-4">
                    <h3 className="font-raleway font-bold mb-2 border-b border-black pb-1">
                        Próximos Eventos
                    </h3>

                    {upcomingEvents.length === 0 ? (
                        <p className="text-xs text-gray-500 italic font-nunito">
                            Nenhum evento nos próximos dias
                        </p>
                    ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="py-1 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${categoryColors[event.category || 'other']}`}></div>

                                        <span className="text-xs font-medium bg-gray-100 px-1 rounded">
                                            {format(event.startDate.toDate(), 'd MMM', { locale: ptBR })}
                                        </span>

                                        <span className="text-xs font-medium text-gray-500">
                                            {format(event.startDate.toDate(), 'HH:mm')}
                                        </span>

                                        <span className="text-xs font-bold truncate">{event.title}</span>

                                        {event.childName && (
                                            <div className="flex items-center ml-auto">
                                                {event.childPhotoURL ? (
                                                    <div className="w-3 h-3 rounded-full overflow-hidden border border-gray-300">
                                                        <Image
                                                            src={event.childPhotoURL}
                                                            alt={event.childName}
                                                            width={12}
                                                            height={12}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Full Calendar Link */}
            <div className="flex justify-end mt-2">
                    <Link href={`/${username}/calendario`}>
                        <Button
                            variant={null}
                            size="sm"
                            className="text-md font-semibold font-raleway"
                        >
                            Calendario completo
                            <ChevronRight/>
                        </Button>
                    </Link>
                </div>
        </div>
    );
};