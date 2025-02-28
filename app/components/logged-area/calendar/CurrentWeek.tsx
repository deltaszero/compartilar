// components/ModernWeekCalendar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

// Add required plugins
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// Define types
interface Event {
    id: string;
    date: string; // ISO format date
    color?: string;
}

interface DayInfo {
    date: Dayjs;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    isSelected: boolean;
    events: Event[];
}

interface ModernWeekCalendarProps {
    events?: Event[];
    onDateSelect?: (date: Dayjs) => void;
    selectedDate?: Dayjs;
}

const ModernWeekCalendar: React.FC<ModernWeekCalendarProps> = ({
    events = [],
    onDateSelect,
    selectedDate,
}) => {
    const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
    const [currentDate, setCurrentDate] = useState<Dayjs>(selectedDate || dayjs());

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
            const dateStr = currentDay.format('YYYY-MM-DD');

            days.push({
                date: currentDay,
                dayName: currentDay.format('ddd'),
                dayNumber: currentDay.date(),
                isToday: currentDay.isSame(dayjs(), 'day'),
                isSelected: currentDay.isSame(selectedDate || currentDate, 'day'),
                events: events.filter(event => event.date === dateStr)
            });
        }

        setWeekDays(days);
    }, [currentDate, events, selectedDate]);

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

                        {/* Event Badges
                        {day.events.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mt-1 w-full">
                                {day.events.slice(0, 3).map((event, i) => (
                                    <span
                                        key={event.id || i}
                                        className="block w-2 h-2 rounded-full"
                                        style={{ backgroundColor: event.color || '#6366F1' }}
                                    />
                                ))}
                                {day.events.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                        +{day.events.length - 3}
                                    </span>
                                )}
                            </div>
                        )} */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModernWeekCalendar;