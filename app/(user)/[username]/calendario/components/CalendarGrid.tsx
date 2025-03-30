import React from "react";
import { CalendarGridProps } from "./types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDate, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";


export function CalendarGrid({
    days,
    onSelectDate,
    onDoubleClick,
    isLoading,
    currentMonth,
    onPrevMonth,
    onNextMonth,
    onTodayClick
}: CalendarGridProps) {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="border-2 border-black p-4 bg-white shadow-brutalist flex flex-col gap-4">
            {/* Calendar Header (Integrated) */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between border-2 border-border rounded-base p-4 bg-bg shadow-shadow"> */}
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row justify-between items-center gap-4">
                    <div className="flex">
                        <Button
                            variant="default"
                            onClick={onPrevMonth}
                            className="aspect-square bg-bw p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {/* dummy horizontal filler */}
                        <div className="w-2" />
                        <Button
                            variant="neutral"
                            onClick={onNextMonth}
                            className="aspect-square bg-bw p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0 font-raleway">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <Button
                        variant="default"
                        onClick={onTodayClick}
                        className="px-4 text-md font-semibold font-raleway"
                    >
                        {/* <Calendar /> */}
                        <span>Hoje</span>
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="w-full">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map((day) => (
                        <div
                            key={day}
                            className="text-center font-bold py-2 text-xs sm:text-sm font-raleway"
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
                                "aspect-square p-1 border-2 cursor-pointer overflow-hidden relative bg-white transition-transform hover:scale-[0.98] font-raleway",
                                day.isSelected ? "border-black" : "border-gray-300",
                                !day.isCurrentMonth && "opacity-50",
                                day.isToday && "bg-gray-100"
                            )}
                        >
                            <div className={cn(
                                "text-xs sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center",
                                day.isToday && "bg-black text-white border-black"
                            )}>
                                {getDate(day.date)}
                            </div>

                            <div className="space-y-1 mt-1">
                                {day.events && day.events.slice(0, 2).map((event, i) => (
                                    <div
                                        key={`${event.id || 'unknown'}-${i}`}
                                        className={cn(
                                            "text-[9px] sm:text-xs truncate border-l-4 px-1 py-0.5",
                                            event.category === 'school' && "border-blue-500",
                                            event.category === 'medical' && "border-red-500",
                                            event.category === 'activity' && "border-green-500",
                                            event.category === 'visitation' && "border-purple-500",
                                            event.category === 'other' && "border-gray-500"
                                        )}
                                    >
                                        {event.title || 'Untitled Event'}
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
        </div>
    );
}