// app/(user)/[username]/layout.tsx
'use client';
import Sidebar from "@components/Sidebar";
import ContentArea from "@components/ContentArea";
import BottomNav from "@components/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col xl:flex-row font-nunito min-h-screen overflow-hidden">
            {/* Sidebar (Browser) */}
            <div className="hidden xl:block w-full xl:w-1/5 bg-neutral text-neutral-content">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="w-screen xl:w-4/5">
                <ContentArea>
                    {children}
                </ContentArea>
            </div>
            {/* Bottom Navigation (Mobile) */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50">
                <BottomNav />
            </div>
        </div>
    );
}