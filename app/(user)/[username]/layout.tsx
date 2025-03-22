
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@context/userContext';
import { usePathname, useRouter, useParams } from 'next/navigation';
import LoadingPage from '@/app/components/LoadingPage';
import Sidebar from "@/app/components/logged-area/ui/Sidebar";
import ContentArea from "@/app/components/logged-area/ui/ContentArea";
import BottomNav from "@/app/components/logged-area/ui/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { username } = useParams<{ username: string }>();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Track screen size
        useEffect(() => {
            const checkMobileScreen = () => {
                setIsMobile(window.innerWidth < 768);
            };
    
            checkMobileScreen();
            window.addEventListener("resize", checkMobileScreen);
            return () => window.removeEventListener("resize", checkMobileScreen);
        }, []);

    // Check authentication and permissions
    useEffect(() => {
        // Wait for user data to be loaded
        if (loading) return;

        // If no user is logged in, redirect to login
        if (user === null) {
            router.push('/login');
            return;
        }
        
        if (userData) {
            // If accessing someone else's routes other than profile, redirect
            // Only redirect if we're viewing someone else's profile AND it's not a profile page
            const isViewingOtherUser = userData.username !== username;
            const isProfilePage = pathname.includes(`/${username}/perfil`);
            
            if (isViewingOtherUser && !isProfilePage) {
                router.push(`/${username}/perfil`);
                return;
            }
            
            // We're authenticated and have proper permissions
            setIsCheckingAuth(false);
        }
    }, [user, userData, loading, username, pathname, router]);

    // Show loading while checking authentication
    if (loading || isCheckingAuth) {
        return <LoadingPage />;
    }

    return (
        <div className="flex flex-col sm:flex-row min-h-screen bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-main to-bg">
            {/* Sidebar (Browser) */}
            <div className="hidden xl:block w-full xl:w-1/6 bg-blank text-white">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="h-full w-full xl:w-5/6">
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