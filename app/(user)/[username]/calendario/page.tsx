"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import Calendar from "../calendario/components/Calendar";

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

                <Suspense fallback={
                    <div className="flex justify-center items-center h-[300px] sm:h-[400px] border-4 border-black">
                        <Loader2 className="h-8 w-8 animate-spin text-black" />
                    </div>
                }>
                    <Calendar />
                </Suspense>
            </div>
        </div>
    );
}