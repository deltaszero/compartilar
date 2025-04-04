"use client";

import { Suspense } from "react";
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import Calendar from "../calendario/components/Calendar";
import { Skeleton } from "@/components/ui/skeleton";

// Calendar page skeleton loader that matches the brutalist design
const CalendarSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 space-y-4 sm:gap-4 sm:space-y-0">
            {/* DayEvents section skeleton */}
            <div className="flex flex-col gap-4">
                <div className="border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                    {/* Date header skeleton */}
                    <div className="flex flex-col justify-between gap-4 mb-4">
                        <Skeleton className="h-7 w-60" />
                        
                        {/* Button skeletons */}
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-9 w-28" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>

                    {/* Empty state skeleton */}
                    <div className="h-[300px] border-[1px] border-dashed border-blank flex items-center justify-center">
                        <Skeleton className="h-5 w-48" />
                    </div>
                </div>
            </div>

            {/* Calendar grid skeleton */}
            <div className="col-span-2 flex flex-col gap-4">
                <div className="border-2 border-black p-4 bg-white shadow-brutalist flex flex-col gap-4">
                    {/* Calendar header skeleton */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex">
                                <Skeleton className="h-8 w-8 rounded" />
                                <div className="w-2" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <Skeleton className="h-9 w-20" />
                    </div>

                    {/* Calendar days grid skeleton */}
                    <div>
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                <div key={day} className="text-center font-bold py-2 text-xs sm:text-sm font-raleway">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid cells skeleton */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array(35).fill(0).map((_, index) => (
                                <div
                                    key={index}
                                    className="aspect-square p-1 border-2 border-gray-300 overflow-hidden relative bg-white h-20 sm:h-24 lg:h-28"
                                >
                                    <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 rounded-full" />
                                    
                                    {/* Some cells have event skeletons */}
                                    {index % 4 === 0 && (
                                        <div className="space-y-1 mt-2">
                                            <Skeleton className="h-4 w-full mt-1" />
                                            {index % 8 === 0 && <Skeleton className="h-4 w-4/5 mt-1" />}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CalendarioPage() {
    return (
        <div>
            <UserProfileBar pathname='Calendário' />
            <div className="flex flex-col p-4 sm:p-6 pb-[6em]">
                <div className="mb-4 sm:mb-6 border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist inline-block">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-raleway">
                        Calendário
                    </h1>
                    <p className="mt-1 text-sm sm:text-base font-nunito">
                        Gerencie e compartilhe eventos, compromissos e visitas
                    </p>
                </div>

                <Suspense fallback={<CalendarSkeleton />}>
                    <Calendar />
                </Suspense>
            </div>
        </div>
    );
}