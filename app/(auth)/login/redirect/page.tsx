// app/(user)/[username]/page.tsx
'use client';
// imoprting built-in modules
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
// importing components
import { useUser } from '@context/userContext';
import LoadingPage from '@/app/components/LoadingPage';
// importing assets
// importring components 

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error">User not found</p>
    </div>
);

export default function UserPage() {
    const { username } = useParams();
    const router = useRouter();
    const { user, userData, loading } = useUser();
    // check if user is logged in and if the user is the same as the one being accessed
    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            // else if (userData?.username !== username) router.push('/');
        }
    }, [user, userData, loading, username, router]);
    // if (loading) return <LoadingSkeleton />;
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    if (initialLoading) return <LoadingPage />;
    if (!userData) return <UserNotFound />;
    router.push(`/${userData.username}/home`)
    return (
        <article>
            <div/>
        </article>
    );
}
