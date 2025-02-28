// components/Calendar.jsx
"use client";

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface CalendarDay {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Generate calendar days for the month
  useEffect(() => {
    const firstDayOfMonth = currentMonth.startOf('month');
    const lastDayOfMonth = currentMonth.endOf('month');
    const startDay = firstDayOfMonth.day(); // 0 = Sunday, 6 = Saturday
    
    // Create array to hold all calendar days
    const daysArray = [];
    
    // Add days from previous month to fill the first week
    for (let i = 0; i < startDay; i++) {
      daysArray.push({
        date: firstDayOfMonth.subtract(startDay - i, 'day'),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
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
      });
    }
    
    // Add days from next month to complete the grid (total 42 cells for 6 rows)
    const remainingDays = 42 - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push({
        date: lastDayOfMonth.add(i, 'day'),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    
    setCalendarDays(daysArray);
  }, [currentMonth, selectedDate]);
  
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow">
      <div className="p-4 flex justify-between items-center bg-gray-100 rounded-t-lg">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          &lt;
        </button>
        <h2 className="text-lg font-semibold">
          {currentMonth.format('MMMM YYYY')}
        </h2>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          &gt;
        </button>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div 
              key={day} 
              className="text-center font-medium text-sm text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => selectDate(day.date)}
              className={`
                h-10 w-10 flex items-center justify-center rounded-full text-sm
                ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                ${day.isToday ? 'bg-blue-100 text-blue-600' : ''}
                ${day.isSelected && !day.isToday ? 'bg-blue-500 text-white' : ''}
                ${!day.isSelected && !day.isToday && day.isCurrentMonth ? 'hover:bg-gray-100' : ''}
              `}
            >
              {day.date.date()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t flex justify-between items-center">
        <button 
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Today
        </button>
        <div className="text-sm">
          Selected: <span className="font-medium">{selectedDate.format('MMM D, YYYY')}</span>
        </div>
      </div>
    </div>
  );
}