'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import { UserNavbar } from './components/UserNavbar';
import { UserNotFound } from './components/UserNotFound';

/**
 * UserProfileBar is the main exported component
 */
const UserProfileBar = ({ pathname }: { pathname: string }) => {
    const { userData } = useUser();
    const router = useRouter();
    
    const handleBackClick = () => {
        router.back();
    };
    
    if (!userData) return <UserNotFound />;
    
    return (
        <>
            <UserNavbar 
                pathname={pathname} 
                onBackClick={handleBackClick}
                userData={userData}
            />
            <Toaster />
        </>
    );
};

export default UserProfileBar;