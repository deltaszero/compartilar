// app/settings/page.tsx
'use client';

import React from 'react';
import CalendarPage from "@components/CoparentingCalendar";

export default function SettingsPage() {

    return (
        <div className="h-screen flex flex-col">
            <CalendarPage />
        </div>
    );
}