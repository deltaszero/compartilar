// app/settings/page.tsx
'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import React from 'react';
// import { motion } from 'framer-motion';
import {
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
//
import { db } from '@/app/lib/firebaseConfig';
//
import { useUser } from '@context/userContext';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
// import CameraIcon from '@assets/icons/camera.svg';
import EditIcon from '@assets/icons/edit.svg';
import CalendarPage from "@/app/components/logged-area/calendar/CoparentingCalendar";
// import NavLink from '@components/ui/NavLink';
import FriendSearch from '@/app/components/logged-area/friendship/FriendSearch';
import FriendRequests from '@/app/components/logged-area/friendship/FriendRequests';
import FriendList from '@/app/components/logged-area/friendship/FriendList';
import LoadingPage from '@/app/components/LoadingPage';

// import background_img from "@assets/images/970e47d6-0592-4edb-adea-e73211796eac_1.png";
import support_img from "@assets/images/support-icon.png";
import calendar_img from "@assets/images/calendar-icon.png";
import family_img from "@assets/images/family-icon.png";

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

interface KidInfo {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other' | null;
    relationship: 'biological' | 'adopted' | 'guardian' | null;
}

// const UserNotFound = () => (
//     <div className="flex flex-1 items-center justify-center">
//         <p className="text-xl text-error uppercase">
//             User not found
//         </p>
//     </div>
// );

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// const AvatarSection = ({ photoURL }: { photoURL?: string }) => (
//     <motion.div
//         className="mask mask-squircle bg-gray-100 flex items-center justify-center"
//         whileHover={{ scale: 1.1 }}
//     >
//         {photoURL ? (
//             <Image
//                 src={photoURL}
//                 width={72}
//                 height={72}
//                 alt="User avatar"
//                 className="object-cover"
//                 priority
//             />
//         ) : (
//             <CameraIcon className="w-12 h-12 text-gray-400" />
//         )}
//     </motion.div>
// );

const UserProfileCard = ({ userData }: { userData: Partial<SignupFormData> }) => (
    <div className="flex flex-col items-start w-full py-4 gap-8 z-[10] p-4">
        {/* <AvatarSection photoURL={userData?.photoURL} /> */}
        <div className="flex flex-col items-start gap-0">
            <div className="text-4xl font-semibold">
                Olá,<br /> {capitalizeFirstLetter(userData.firstName || '')}!
            </div>
            <div className="text-sm ">
                @{userData.username}
            </div>
        </div>
    </div>
);

const fetchChildren = async (parentId: string): Promise<KidInfo[]> => {
    const q = query(
        collection(db, 'children'),
        where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            gender: data.gender,
            relationship: data.relationship
        };
    });
};


const ChildCard = ({ kid }: { kid: KidInfo }) => (
    <div className="flex items-center ">
        {/* CARD */}
        <article className="card card-side bg-base-100 shadow-xl w-full rounded-xl">
            {/* AVATAR */}
            <figure className="bg-neutral">
                <div className="relative w-24 flex items-center justify-center">
                    <span className="text-2xl text-neutral-content">
                        {kid.firstName[0].toUpperCase()}{kid.lastName[0].toUpperCase()}
                    </span>
                    <div className="absolute bottom-1 left-1 p-[5px] bg-accent text-accent-content rounded-full">
                        <EditIcon width={12} height={12} />
                    </div>
                </div>
            </figure>
            {/* BODY */}
            <div className="card-body px-4">
                {/* CARD TITLE */}
                <h2 className="card-title">
                    {kid.firstName} {kid.lastName}
                </h2>
                {/* <p>
                            {kid.birthDate}
                        </p> */}
                <div className='flex flex-row gap-1 text-wrap py-1'>
                            <div className="badge badge-sm badge-neutral">neutral</div>
                            <div className="badge badge-sm badge-primary">primary</div>
                        </div>

                {/* CARD ACTIONS */}
                <div className="card-actions justify-end">
                    <button className="btn btn-xs btn-outline btn-primary">
                        Detalhes
                    </button>
                </div>
            </div>
        </article>
    </div>
);

const KidsGrid = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    // const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChildren = async () => {
            try {
                const data = await fetchChildren(parentId);
                setKidsArray(data);
            } catch (error) {
                console.error('Error fetching children:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, [parentId]);

    if (loading) return <div className="w-full h-48 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
    </div>;

    if (!kidsArray.length) return null;

    return (
        <div className="flex flex-col gap-4">
            {/* Slides */}
            {kidsArray.map((kid) => (
                <div key={kid.id}>
                    <ChildCard kid={kid} />
                </div>
            ))}
        </div>
    );
};


export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener('resize', checkMobileScreen);
        return () => window.removeEventListener('resize', checkMobileScreen);
    }, []);
    console.log(isMobile);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    console.log(initialLoading);
    if (!userData) return <LoadingPage />;

    return (
        <div className='flex flex-col mb-[10em] sm:mb-0 sm:p-6 sm:gap-6 bg-base-300'>
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                BACKGROUND IMAGE 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <div className="flex flex-col relative bg-base-100 sm:rounded-3xl shadow-xl">
                {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    PROFILE BAR 
                - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
                <section className="flex flex-col mb-8">
                    <div className=" z-[10]">
                        <UserProfileBar pathname="Meu Lar" />
                    </div>
                    <UserProfileCard userData={userData} />
                </section>
            </div>
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                CONTENT BAR 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <article className="flex flex-col bg-base-100 rounded-3xl z-[10] -mt-10 sm:-mt-0">
                <div className="flex flex-col gap-4 sm:flex-row ">
                    {/* - - - - - - - - - - - - CALENDAR - - - - - - - - - - - - */}
                    <section className="container mx-auto p-4">
                        <div className="flex items-center justify-between px-2 rounded-lg bg-info relative mx-auto shadow-xl mb-4">
                            <h2 className="text-xl font-bold z-10">
                                Calendário
                            </h2>
                            <Image
                                src={calendar_img}
                                alt="Background"
                                priority
                                quality={75}
                                className="object-contain"
                                height={75}
                            />
                            <div className="absolute top-2 right-2">
                            </div>
                        </div>
                        <div className="bg-base-100 rounded-xl shadow-xl">
                            <CalendarPage />
                        </div>
                    </section>
                    {/* - - - - - - - - - - - - KIDS - - - - - - - - - - - - */}
                    <section className="container mx-auto p-4">
                        <div className="flex items-center justify-between px-2 rounded-lg bg-warning relative mx-auto shadow-xl mb-4">
                            <h2 className="text-xl font-bold z-10">
                                Família
                            </h2>
                            <Image
                                src={family_img}
                                alt="Background"
                                priority
                                quality={75}
                                className="object-contain"
                                height={75}
                            />
                            <div className="absolute top-2 right-2">
                            </div>
                        </div>
                        <div>
                            <div>
                                <KidsGrid parentId={userData.uid} />
                            </div>
                        </div>
                    </section>
                </div>
                {/* - - - - - - - - - - - - SUPPORT NETWORK - - - - - - - - - - - - */}
                <section className="container mx-auto p-4">
                    <div className="flex items-center justify-between px-2 rounded-lg bg-secondary relative mx-auto shadow-xl mb-4">
                        <h2 className="text-xl font-bold z-10">
                            Rede de Apoio
                        </h2>
                        <Image
                            src={support_img}
                            alt="Background"
                            priority
                            quality={75}
                            className="object-contain"
                            height={75}
                        />
                    </div>
                    <FriendList userId={userData.uid} />
                    <FriendSearch />
                    <FriendRequests />
                </section>
                <section className="flex flex-row flex-start gap-8 w-full mx-auto p-4">
                    <div role="alert" className="alert alert-warning">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 shrink-0 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>EM DESENVOLVIMENTO</span>
                    </div>
                </section >
            </article>
        </div>
    );
}