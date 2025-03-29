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
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0 font-raleway">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
                <Button
                    variant="default"
                    onClick={onTodayClick}
                    className="px-4 text-md font-semibold font-raleway"
                >
                    <Calendar/>
                    <span>Hoje</span>
                </Button>
                {/* dummy horizontal filler */}
                <div className="w-2" />
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
            </div>
        </div>
    );
}