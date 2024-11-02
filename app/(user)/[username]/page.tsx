// app/(user)/[username]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@context/userContext';
import LoginHeader from "@components/layout/LoginHeader";

export default function UserPage() {
    const { username } = useParams();
    const router = useRouter();
    const { user, userData, loading } = useUser();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (userData?.username !== username) {
                router.push('/');
            }
        }
    }, [user, userData, loading, username, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="h-screen flex flex-col">
            <LoginHeader />
            <section className="flex flex-col justify-center items-center min-h-screen">
            {userData ? (
                <div>
                    <h1>Hello, {userData.username}!</h1>
                    <p>Your email: {userData.email}</p>
                </div>
            ) : (
                <p>User not found</p>
            )}
            </section>
        </div>
    );
}
