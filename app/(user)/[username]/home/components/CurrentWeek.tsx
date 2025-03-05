"use client";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WeekDay } from "../types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useUser } from "@/context/userContext";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { isSameDay } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchEvents, fetchChildren } from "../../calendario/components/calendar-service";
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
  const { userData } = useUser();
  const params = useParams();
  const username = params.username as string;
  
  // Load children and events
  useEffect(() => {
    if (!userData) return;
    
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Fetch children first
        const childrenData = await fetchChildren(userData.uid);
        setChildren(childrenData);
        
        // Calculate date range for the entire week with buffer
        const weekStart = selectedDate.startOf('week').subtract(1, 'day').toDate();
        const weekEnd = selectedDate.endOf('week').add(1, 'day').toDate();
        
        // Fetch events for the week
        const eventsData = await fetchEvents(
          userData.uid,
          weekStart,
          weekEnd,
          childrenData
        );
        
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading weekly events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [userData, selectedDate]);
  
  // Generate week days
  useEffect(() => {
    const weekStart = selectedDate.startOf('week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = weekStart.add(i, 'day');
      
      // Count events for this day 
      const dayEvents = events.filter(event => {
        const eventDate = event.startTime.toDate();
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
    const eventDate = event.startTime.toDate();
    return isSameDay(eventDate, selectedDate.toDate());
  });
  
  // Get upcoming events (next 3 days excluding today)
  const today = dayjs();
  const upcomingEvents = events
    .filter(event => {
      const eventDate = event.startTime.toDate();
      const eventDay = dayjs(eventDate);
      return eventDay.isAfter(today, 'day') && eventDay.diff(today, 'day') <= 3;
    })
    .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime())
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
            variant="default"
            size="icon"
            aria-label="Previous week"
            className="bg-bw"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center relative">
            <h2 className="text-lg font-bold tracking-tight border-b-2 border-black pb-1 px-2">
              {weekDays.length > 0 ? `${weekDays[0].date.format('MMM D')} - ${weekDays[6].date.format('MMM D, YYYY')}` : ''}
            </h2>
          </div>

          <Button 
            onClick={nextWeek} 
            variant="default"
            size="icon"
            aria-label="Next week"
            className="bg-bw"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day, index) => (
            <Button
              key={index}
              onClick={() => handleDaySelect(day)}
              variant="default"
              className={`
                h-auto flex flex-col items-center py-2 px-1 rounded-none
                border ${day.isSelected ? 'border-2' : 'border'} border-black
                ${day.isToday 
                  ? '' // ? 'bg-yellow-300' 
                  : day.isSelected && !day.isToday 
                    // ? 'bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white hover:bg-gray-50'}
                transition-all relative
              `}
            >
              {/* Event dot indicator */}
              {(day.eventCount ?? 0) > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-black"></div>
              )}
              
              {/* Day Name */}
              <span className="text-xs font-bold mb-1 text-black">
                {day.dayName[0].toUpperCase()}
              </span>

              {/* Day Number */}
              <span className={`
                flex items-center justify-center w-7 h-7 font-bold
                ${day.isToday
                  // ? 'bg-black text-yellow-300'
                  ? 'bg-black text-white'
                  : day.isSelected && !day.isToday
                    // ? 'bg-yellow-300 text-black'
                    ? 'text-black'
                    : ''
                }
                ${day.isToday || (day.isSelected && !day.isToday) ? 'border border-black' : ''}
              `}>
                {day.dayNumber}
              </span>
            </Button>
          ))}
        </div>
        
        {/* Day Events Section */}
        <div className="mt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-base">
              {selectedDate 
                ? format(selectedDate.toDate(), "d 'de' MMMM", { locale: ptBR })
                : "Selecione uma data"}
            </h3>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onDateSelect(dayjs())}
              className="bg-main border-2 border-black shadow-brutalist-sm hover:translate-y-1 transition-transform flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              <span>Hoje</span>
            </Button>
          </div>
          
          {/* List of events for selected day */}
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nenhum evento para este dia</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="py-1 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${categoryColors[event.category]}`}></div>
                    <span className="text-xs font-medium text-gray-500">
                      {format(event.startTime.toDate(), 'HH:mm')}
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
          <h3 className="font-bold text-base mb-2 border-b border-black pb-1">Próximos Eventos</h3>
          
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nenhum evento nos próximos dias</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="py-1 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${categoryColors[event.category]}`}></div>
                    
                    <span className="text-xs font-medium bg-gray-100 px-1 rounded">
                      {format(event.startTime.toDate(), 'd MMM', { locale: ptBR })}
                    </span>
                    
                    <span className="text-xs font-medium text-gray-500">
                      {format(event.startTime.toDate(), 'HH:mm')}
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

        {/* Full Calendar Link */}
        <div className="flex justify-end mt-4">
          <Link href={`/${username}/calendario`}>
            <Button 
              variant="default" 
              size="sm"
              className="bg-main"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Calendario Completo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};