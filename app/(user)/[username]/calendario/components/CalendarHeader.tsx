"use client";

import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays
} from "lucide-react";
import { CalendarHeaderProps } from "./types";
import { cn } from "@/lib/utils";

export function CalendarHeader({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth, 
  onTodayClick 
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 mb-4">
      <div className="flex items-center">
        <h2 className="text-xl font-bold">{currentMonth.format('MMMM YYYY')}</h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onPrevMonth}
          className={cn(
            "h-8 w-8",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onTodayClick}
          className="h-8 px-2 text-xs"
          aria-label="Today"
        >
          Hoje
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onNextMonth}
          className={cn(
            "h-8 w-8",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onTodayClick}
          className={cn(
            "h-8 w-8 lg:hidden",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          aria-label="Today"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}