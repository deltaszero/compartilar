"use client";

import { cn } from "@/lib/utils";
import { CalendarGridProps, EventDotProps } from "./types";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function EventDot({ category, onClick }: EventDotProps) {
  const categoryColors = {
    school: "bg-blue-500",
    medical: "bg-red-500",
    activity: "bg-green-500",
    visitation: "bg-purple-500",
    other: "bg-gray-500"
  };

  const color = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;

  return (
    <div 
      className={cn(
        "h-2 w-2 rounded-full",
        color
      )}
      onClick={onClick}
    />
  );
}

export function CalendarGrid({ days, onSelectDate, onDoubleClick }: CalendarGridProps) {
  return (
    <div className="rounded-md border shadow-sm">
      <div className="grid grid-cols-7 gap-px bg-muted">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="text-xs font-medium text-muted-foreground text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-muted">
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              "relative h-14 lg:h-20 p-1 bg-background",
              "flex flex-col justify-start items-start",
              !day.isCurrentMonth && "text-muted-foreground bg-muted/50",
              day.isToday && "border border-primary",
              day.isSelected && "bg-accent/50"
            )}
            onClick={() => onSelectDate(day.date)}
            onDoubleClick={() => onDoubleClick(day.date)}
          >
            <div className={cn(
              "h-6 w-6 flex items-center justify-center text-xs rounded-full",
              day.isToday && "bg-primary text-primary-foreground",
              day.isSelected && !day.isToday && "bg-accent text-accent-foreground font-bold"
            )}>
              {day.date.date()}
            </div>
            
            {/* Event dots */}
            <div className="flex gap-1 mt-1 flex-wrap">
              {day.events.slice(0, 3).map((event, idx) => (
                <EventDot 
                  key={idx} 
                  category={event.category} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(day.date);
                    // We don't call onDoubleClick here because that opens new event form
                    // instead, selected date will show event details including edit button
                  }} 
                />
              ))}
              {day.events.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{day.events.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}