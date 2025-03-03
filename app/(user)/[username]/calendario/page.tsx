"use client";

import { Calendar } from "./components/Calendar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function CalendarioPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e compartilhe eventos, compromissos e visitas
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <Calendar />
      </Suspense>
    </div>
  );
}