// app/settings/page.tsx
'use client';

import React from 'react';
import CalendarPage from "@/app/components/logged-area/calendar/Calendar";

export default function SettingsPage() {

    return (
        <div className="h-screen flex flex-col">
            <CalendarPage />
        </div>
    );
}