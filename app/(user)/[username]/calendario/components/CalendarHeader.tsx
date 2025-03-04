import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { CalendarHeaderProps } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onTodayClick
}: CalendarHeaderProps) {
  return (
    // <div className="flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </h2>
      
      <div className="flex items-center gap-2 justify-between sm:justify-end">
        <Button 
          variant="default"
          onClick={onTodayClick}
          className="border-2 border-black hover:translate-y-1 transition-transform flex items-center gap-1 px-2 sm:px-3 h-8 sm:h-10 text-xs sm:text-sm"
        >
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Hoje</span>
        </Button>
        {/* dummy horizontal filler */}
        <div className="w-2" />
        <div className="flex">
          <Button 
            variant="neutral"
            onClick={onPrevMonth}
            className="border-2 border-black hover:translate-y-1 transition-transform h-8 sm:h-10 w-8 sm:w-10 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {/* dummy horizontal filler */}
          <div className="w-2" />
          <Button 
            variant="neutral"
            onClick={onNextMonth}
            className="border-2 border-black hover:translate-y-1 transition-transform h-8 sm:h-10 w-8 sm:w-10 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}