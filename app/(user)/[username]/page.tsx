// app/(user)/[username]/page.tsx
'use client';
// importing modules
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// importing components
import { useUser } from '@context/userContext';
import LoadingPage from '@/app/components/LoadingPage';

/**
 * Root user area page - redirects to the home page for the current user
 * or to the profile page for other users
 */
export default function UserRootPage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            // not logged in
            router.push('/login');
            return;
        }

        // if it's the current user, go to their home page
        // otherwise, go to the profile page
        if (userData?.username === username) {
            router.push(`/${username}/home`);
        } else {
            router.push(`/${username}/perfil`);
        }
    }, [user, userData, loading, username, router]);

    return <LoadingPage />;
}
