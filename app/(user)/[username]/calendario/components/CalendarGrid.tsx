import React from "react";
import { CalendarGridProps } from "./types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDate } from "date-fns";

export function CalendarGrid({ days, onSelectDate, onDoubleClick }: CalendarGridProps) {
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="border-4 border-black p-2 sm:p-3 bg-white shadow-brutalist">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div 
            key={day}
            className="text-center font-bold py-1 sm:py-2 text-xs sm:text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => onSelectDate(day.date)}
            onDoubleClick={() => onDoubleClick(day.date)}
            className={cn(
              "h-16 sm:h-20 md:h-24 p-1 border-2 cursor-pointer overflow-hidden relative bg-white transition-transform hover:scale-[0.98]",
              day.isSelected ? "border-black" : "border-gray-300",
              !day.isCurrentMonth && "opacity-50",
              day.isToday && "bg-gray-100"
            )}
          >
            <div className={cn(
              "text-xs sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center",
              day.isToday && "bg-black text-white border-black rounded-md"
            )}>
              {getDate(day.date)}
            </div>

            <div className="space-y-1 mt-1">
              {day.events.slice(0, 2).map((event, i) => (
                <div 
                  key={`${event.id}-${i}`}
                  className={cn(
                    "text-[9px] sm:text-xs truncate border-l-4 px-1 py-0.5",
                    event.category === 'school' && "border-blue-500",
                    event.category === 'medical' && "border-red-500",
                    event.category === 'activity' && "border-green-500",
                    event.category === 'visitation' && "border-purple-500",
                    event.category === 'other' && "border-gray-500"
                  )}
                >
                  {event.title}
                </div>
              ))}

              {day.events.length > 2 && (
                <Badge 
                  variant="default" 
                  className="text-[8px] sm:text-[10px] border-2 border-black bg-white shadow-brutalist-sm px-1 transition-transform hover:translate-y-0.5"
                >
                  +{day.events.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}