// app/settings/page.tsx
'use client';

import React from 'react';
import UserProfileBar from "@components/UserProfileBar";

export default function SettingsPage() {

    return (
        <div className="h-screen flex flex-col">
            <UserProfileBar />
        </div>
    );
}