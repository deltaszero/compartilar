// app/(user)/[username]/page.tsx
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

import { useUser } from '@context/userContext';

import CameraIcon from '@assets/icons/camera.svg';

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


    return (
        <div className="flex flex-col">
            <section className="flex flex-col justify-center items-center min-h-screen">
                <div className="flex flex-col items-left gap-4">
                    <div className="avatar">
                        {loading ? (
                            <div className="mask mask-squircle w-32">
                                <div className="skeleton h-32 w-32 rounded-md"></div>
                            </div>
                        ) : (
                            <div className="mask mask-squircle w-32">
                                {userData && userData.photoURL ? (
                                    <Image
                                        src={userData.photoURL}
                                        width={256}
                                        height={256}
                                        alt="Avatar"
                                        priority
                                    />
                                ) : (
                                    <CameraIcon width={34} height={34} />
                                )}
                            </div>
                        )}
                    </div>
                    <div className='flex flex-col gap-4 items-center'>
                        {loading ? (
                            <div className="flex flex-col gap-4">
                                <div className="skeleton h-4 w-72 rounded-md"></div>
                                <div className="skeleton h-4 w-72 rounded-md"></div>
                            </div>
                        ) : (
                            <div>
                                {userData ? (
                                    <div>
                                        <h1>Hello, {userData.username}!</h1>
                                        <p>Your email: {userData.email}</p>
                                    </div>
                                ) : (
                                    <p>User not found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section >
        </div >
    );
}
