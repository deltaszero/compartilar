// app/(user)/[username]/layout.tsx
'use client';
import { useState } from 'react';
import Sidebar from "@components/Sidebar";
import ContentArea from "@components/ContentArea";
import IconHamburger from '@assets/icons/hamburger.svg';
import LoginHeader from "@components/layout/LoginHeader";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col xl:flex-row font-nunito">
            {/* Hamburger Menu Button for Mobile */}
            <button 
                className="xl:hidden px-4 py-2 bg-neutral text-neutral-content"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <div className="flex flex-row justify-center items-center">
                    <IconHamburger width={24} height={24} />
                    <div className="w-full flex flex-row justify-center items-center py-1">
                        <LoginHeader />
                    </div>
                </div>
            </button>

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} xl:block w-full xl:w-1/5 bg-neutral text-neutral-content`}>
                <Sidebar />
            </div>

            {/* Content Area */}
            <div className="w-full xl:w-4/5 p-6">
                <ContentArea>{children}</ContentArea>
            </div>
        </div>
    );
}