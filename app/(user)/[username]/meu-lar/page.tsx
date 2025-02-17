// app/settings/page.tsx
'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
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
import UserProfileBar from "@components/UserProfileBar";
import CameraIcon from '@assets/icons/camera.svg';
import EditIcon from '@assets/icons/edit.svg';
// import background_img from "@assets/images/2fcb3a44-26ce-41b7-a181-f6c55f663025.png";


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



const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error">User not found</p>
    </div>
);

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const AvatarSection = ({ photoURL }: { photoURL?: string }) => (
    <motion.div
        className="mask mask-squircle bg-gray-100 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
    >
        {photoURL ? (
            <Image
                src={photoURL}
                width={72}
                height={72}
                alt="User avatar"
                className="object-cover"
                priority
            />
        ) : (
            <CameraIcon className="w-12 h-12 text-gray-400" />
        )}
    </motion.div>
);

const UserProfileCard = ({ userData }: { userData: Partial<SignupFormData> }) => (
    <div className="flex flex-col items-center w-full px-4 gap-1">
        <AvatarSection photoURL={userData?.photoURL} />
        <div className="flex flex-col items-center gap-0">
            <div className="text-xl font-semibold">
                {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
            </div>
            <div className="text-sm text-gray-400">
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
    <div className="flex items-center w-full">
        {/* CARD */}
        <article className="card bg-base-100 hover:shadow-xl transition-shadow w-full max-w-md rounded-none">
            {/* BODY */}
            <div className="card-body px-4">
                <div className="flex flex-row items-start gap-6">
                    {/* AVATAR */}
                    <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-20 h-20 flex items-center justify-center">
                            <span className="text-2xl">
                                {kid.firstName[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="absolute bottom-0 right-0 p-[5px] bg-accent text-accent-content rounded-full">
                            <EditIcon width={16} height={16} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        {/* CARD TITLE */}
                        <h2 className="card-title">
                            {kid.firstName} {kid.lastName}
                        </h2>
                        <p className="font-medium">
                            {kid.birthDate}
                        </p>
                        <div className="py-1"/>
                        {/* CARD ACTIONS */}
                        <div className="card-actions">
                            <button className="text-white font-semibold btn btn-sm btn-primary">
                                Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    </div>
);

const KidsGrid = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
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

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? kidsArray.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === kidsArray.length - 1 ? 0 : prev + 1));
    };

    if (loading) return <div className="w-full h-48 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
    </div>;

    if (!kidsArray.length) return null;

    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold text-primary-content">
                Família
            </h2>
            <div className="carousel w-full relative">
                {/* Slides Container */}
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        width: `${kidsArray.length * 100}%`
                    }}
                >
                    {/* Slides */}
                    {kidsArray.map((kid) => (
                        <div
                            key={kid.id}
                            className="carousel-item relative w-full flex justify-center"
                        >
                            <ChildCard kid={kid} />
                        </div>
                    ))}
                </div>
                {/* Navigation Controls */}
                <div className="absolute flex justify-between transform -translate-y-1/2 left-2 right-2 top-1/2">
                    <button
                        onClick={handlePrev}
                    // className="btn btn-circle btn-outline shadow-lg"
                    >
                        {/* ❮ */}
                    </button>
                    <button
                        onClick={handleNext}
                        className="btn btn-circle btn-outline shadow-lg"
                    >
                        ❯
                    </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                    {kidsArray.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full ${currentIndex === index
                                ? 'bg-primary scale-125'
                                : 'bg-gray-300'
                                } transition-all duration-300`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener('resize', checkMobileScreen);
        return () => window.removeEventListener('resize', checkMobileScreen);
    }, []);

    if (!userData) return <UserNotFound />;

    return (
        <article className="h-screen flex flex-col">
            <section className="flex flex-col">
                <UserProfileBar pathname="Meu Lar" />
                <UserProfileCard userData={userData} />
            </section>
            {/* KIDS */}
            {isMobile ? (
                <section className="flex-1 mt-2 pt-2 px-2">
                    <section className="p-4 relative">
                        <KidsGrid parentId={userData.uid} />
                    </section>
                </section>
            ) : (
                null
            )}

        </article>
    );
}