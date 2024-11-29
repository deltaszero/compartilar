// app/(user)/[username]/page.tsx
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

import { useUser } from '@context/userContext';

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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 14 14" id="Front-Camera--Streamline-Core" height={32} width={32} ><desc>{"Front Camera Streamline Icon: https://streamlinehq.com"}</desc><g id="front-camera"><g id="Group 2605"><path id="Ellipse 1111" stroke="#currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.95947 6.5c-0.13807 0 -0.25 -0.11193 -0.25 -0.25s0.11193 -0.25 0.25 -0.25" strokeWidth={1} /><path id="Ellipse 1112" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.95947 6.5c0.13807 0 0.25 -0.11193 0.25 -0.25s-0.11193 -0.25 -0.25 -0.25" strokeWidth={1} /></g><g id="Group 2628"><path id="Ellipse 1111_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9.0426 6.5c-0.13807 0 -0.25 -0.11193 -0.25 -0.25s0.11193 -0.25 0.25 -0.25" strokeWidth={1} /><path id="Ellipse 1112_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9.0426 6.5c0.13807 0 0.25 -0.11193 0.25 -0.25S9.18067 6 9.0426 6" strokeWidth={1} /></g><path id="Vector 500" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.5553 8.85718c0.47634 0.48447 1.31765 0.92857 2.44318 0.92857s1.96684 -0.4441 2.44318 -0.92857" strokeWidth={1} /><path id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5c0 -0.26522 -0.1054 -0.51957 -0.2929 -0.70711C13.0196 3.60536 12.7652 3.5 12.5 3.5h-2L9 1.5H5l-1.5 2h-2c-0.26522 0 -0.51957 0.10536 -0.707107 0.29289C0.605357 3.98043 0.5 4.23478 0.5 4.5v7c0 0.2652 0.105357 0.5196 0.292893 0.7071 0.187537 0.1875 0.441887 0.2929 0.707107 0.2929h11c0.2652 0 0.5196 -0.1054 0.7071 -0.2929s0.2929 -0.4419 0.2929 -0.7071v-7Z" strokeWidth={1} /></g></svg>
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
