// app/(user)/[username]/layout.tsx
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@context/userContext';
import { usePathname, useRouter, useParams } from 'next/navigation';
import LoadingPage from '@/app/components/LoadingPage';
import Sidebar from "@/app/components/logged-area/ui/Sidebar";
import ContentArea from "@/app/components/logged-area/layout/ContentArea";
import BottomNav from "@/app/components/logged-area/ui/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { username } = useParams<{ username: string }>();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check authentication and permissions
    useEffect(() => {
        // Wait for user data to be loaded
        if (loading) return;

        // If no user is logged in, redirect to login
        if (!user) {
            router.push('/login');
            return;
        }

        // If accessing someone else's routes other than profile, redirect
        if (userData?.username !== username && !pathname.includes('/perfil')) {
            router.push(`/${username}/perfil`);
            return;
        }

        setIsCheckingAuth(false);
    }, [user, userData, loading, username, pathname, router]);

    // Show loading while checking authentication
    if (loading || isCheckingAuth) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col xl:flex-row font-nunito min-h-screen">
            {/* Sidebar (Browser) */}
            <div className="hidden xl:block w-full xl:w-1/6 bg-primary text-primary-foreground">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="w-screen xl:w-5/6">
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