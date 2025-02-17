// app/(user)/[username]/page.tsx
'use client';
// imoprting built-in modules
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
// importing components
import { useUser } from '@context/userContext';
import LoadingPage from '@components/ui/LoadingPage';
// import { SignupFormData } from '@/types/signup.types';
// importing assets
import CameraIcon from '@assets/icons/camera.svg';
// import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
// import IconBell from '@assets/icons/icon_meu_lar_bell.svg';
import { motion } from 'framer-motion';
import UserProfileBar from "@components/UserProfileBar";
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
                width={128}
                height={128}
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
    <div className="flex flex-col items-start w-full -mt-16 relative z-[10] px-4 gap-1">
        <AvatarSection photoURL={userData?.photoURL} />
        <div className="flex flex-col gap-0">
            <div className="text-2xl font-semibold">
                {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
            </div>
            <div className="text-gray-500">
                {userData.username}
            </div>
        </div>
    </div>
    // <div className="navbar bg-base-100">
    //     <div className="flex-1">
    //         <IconMeuLar width={32} height={32} />
    //     </div>
    //     <div className="flex-none gap-4">
    //         <IconBell width={32} height={32} />
    //         <div className="dropdown dropdown-end">
    //             <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
    //                 <AvatarSection photoURL={userData?.photoURL} />
    //             </div>
    //             <ul
    //                 tabIndex={0}
    //                 className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
    //                 <li>
    //                     <a className="justify-between">
    //                         Profile
    //                         <span className="badge">New</span>
    //                     </a>
    //                 </li>
    //                 <li><a>Settings</a></li>
    //                 <li><a>Logout</a></li>
    //             </ul>
    //         </div>
    //         <motion.div className="flex flex-col justify-center">
    //             <div className="text-secondary-content">
    //                 {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
    //             </div>
    //             <div className="text-gray-500">
    //                 {userData.username}
    //             </div>
    //         </motion.div>
    //     </div>
    // </div>
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
    // if (loading) return <LoadingSkeleton />;
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // if (loading || initialLoading) return <LoadingPage />;
    if (loading && initialLoading) return <LoadingPage />;
    if (!userData) return <UserNotFound />;

    return (
        <article className="flex flex-col items-start overflow-hidden">
            {/* NAVBAR */}
            <UserProfileBar pathname="Perfil" />
            {/* BACKGROUND GRADIENT */}
            <motion.div
                className="
                    h-48 flex items-center justify-center w-full
                    pattern-wavy pattern-green-300 pattern-bg-white pattern-size-2 pattern-opacity-20
                "
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
            </motion.div>
            {/* USER PROFILE CARD */}
            <UserProfileCard userData={userData} />
            {/* CONTENT */}
            <section className="flex flex-row flex-start gap-8 w-full">
                
            </section >
        </article>
    );
}
