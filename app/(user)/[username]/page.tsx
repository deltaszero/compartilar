// app/(user)/[username]/page.tsx
'use client';
// imoprting built-in modules
import { useEffect, } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
// importing components
import { useUser } from '@context/userContext';
import LoadingPage from '@/app/components/LoadingPage';
// import { SignupFormData } from '@/types/signup.types';
// importing assets
import CameraIcon from '@assets/icons/camera.svg';
// import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
// import IconBell from '@assets/icons/icon_meu_lar_bell.svg';
import { motion } from 'framer-motion';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
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

// const UserProfile = ({ userData }: { userData: SignupFormData }) => (
//     <div className="space-y-2">
//         <h1 className="text-4xl font-bold">
//             Welcome, {userData.firstName}!
//         </h1>
//         {/* <p className="text-lg text-gray-600">
//             Registered email: {userData.email}
//         </p> */}
//         {/* <div className="divider" /> */}
//     </div>
// );


// const LoadingSkeleton = () => (
//     <div className="max-w-4xl w-full space-y-8 animate-pulse">
//         <div className="flex items-center gap-4">
//             <div className="mask mask-squircle w-32 h-32 bg-gray-200" />
//             <div className="space-y-2">
//                 <div className="h-6 bg-gray-200 rounded w-48" />
//                 <div className="h-4 bg-gray-200 rounded w-64" />
//             </div>
//         </div>
//         <div className="h-64 bg-gray-200 rounded-lg" />
//     </div>
// );

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

const AvatarSection = ({ photoURL }: { photoURL?: string }) => (
    <motion.div
        className="mask mask-squircle bg-gray-100 flex items-center justify-center w-48 h-48"
        whileHover={{ scale: 1.1 }}
    >
        {photoURL ? (
            <Image
                src={photoURL}
                width={256}
                height={256}
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
    <div className="flex flex-col items-center justify-center bg-base-100 rounded-3xl shadow-xl mx-auto py-4">
        <AvatarSection photoURL={userData?.photoURL} />
        <div className="flex flex-col gap-0 items-center justify-center font-playfair">
            <div className="text-2xl font-semibold">
                {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
            </div>
            <div className="text-gray-500 font-raleway">
                @{userData.username}
            </div>
        </div>
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
            else if (userData?.username !== username) router.push('/');
        }
    }, [user, userData, loading, username, router]);

    if (!userData) return <LoadingPage />

    return (
        <div className="flex flex-col items-start overflow-hidden h-screen">
            {/* NAVBAR */}
            <UserProfileBar pathname="Perfil" />
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    PROFILE BAR 
                - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <div className='w-full p-2'>
            <UserProfileCard userData={userData} />
            </div>
        </div>
    );
}
