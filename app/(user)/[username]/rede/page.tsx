// app/rede/page.tsx
'use client';
import React from 'react';
import UserProfileBar from "@components/UserProfileBar";

export default function ChatPage() {

    return (
        <div className="h-screen flex flex-col">
            <UserProfileBar pathname='Conversas' />
        </div>
    );
}