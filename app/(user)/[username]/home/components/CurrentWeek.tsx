"use client";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { WeekDay } from "../types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CurrentWeekProps {
  selectedDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
}

export const CurrentWeek = ({ selectedDate, onDateSelect }: CurrentWeekProps) => {
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  
  useEffect(() => {
    const weekStart = selectedDate.startOf('week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = weekStart.add(i, 'day');
      days.push({
        date: currentDay,
        dayName: currentDay.format('ddd'),
        dayNumber: currentDay.date(),
        isToday: currentDay.isSame(dayjs(), 'day'),
        isSelected: currentDay.isSame(selectedDate, 'day')
      });
    }

    setWeekDays(days);
  }, [selectedDate]);

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
          </Button>
        ))}
      </div>
    </div>
  );
};