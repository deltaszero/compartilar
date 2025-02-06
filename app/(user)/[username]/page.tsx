// app/(user)/[username]/page.tsx
'use client';
// imoprting built-in modules
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
    collection,
    query, 
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
// importing components
import { useUser } from '@context/userContext';
// import { SignupFormData } from '@/types/signup.types';
// importing assets
import CameraIcon from '@assets/icons/camera.svg';
// importring components 
import CalendarPage from "@components/CoparentingCalendar";

export interface SignupFormData {
    firstName: string;
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


// const AvatarSection = ({ photoURL }: { photoURL?: string }) => (
//     <div className="mask mask-squircle w-32 h-32 bg-gray-100 flex items-center justify-center">
//         {photoURL ? (
//             <Image
//                 src={photoURL}
//                 width={128}
//                 height={128}
//                 alt="User avatar"
//                 className="object-cover"
//                 priority
//             />
//         ) : (
//             <CameraIcon className="w-12 h-12 text-gray-400" />
//         )}
//     </div>
// );


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
    // <div className="flex items-center justify-center w-full">
    //     <article className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow w-2/3">
    <div className="flex items-center w-full">
        <article className="card bg-base-100 hover:shadow-xl transition-shadow w-full max-w-md">
            <div className="card-body">
                <div className="flex flex-row items-start gap-6">
                    <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-24 h-24 flex items-center justify-center">
                            <span className="text-3xl">
                                {kid.firstName[0].toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                        <h3 className="card-title text-lg">
                            {kid.firstName} {kid.lastName}
                        </h3>
                        <dl className="space-y-2">
                            <div>
                                {/* <dt className="text-sm text-gray-500">Birth Date</dt> */}
                                <dd className="font-medium">{kid.birthDate}</dd>
                            </div>
                            {/* {kid.gender && (
                                <div>
                                    <dt className="text-sm text-gray-500">Gender</dt>
                                    <dd className="font-medium capitalize">{kid.gender}</dd>
                                </div>
                            )} */}
                        </dl>
                        {/* <div className="divider"></div> */}
                        <div className="card-actions">
                            <button className="text-primary">
                                View Details
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
        <section className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Children Profiles</h2>
            
            <div className="carousel w-full relative">
                {/* Slides Container */}
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ 
                        transform: `translateX(-${currentIndex * 100}%)`,
                        width: `${kidsArray.length * 100}%`
                    }}
                >
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
                <div className="absolute flex justify-between transform -translate-y-1/2 left-2 right-2 top-1/2 mx-4">
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
                            className={`w-3 h-3 rounded-full ${
                                currentIndex === index 
                                    ? 'bg-primary scale-125' 
                                    : 'bg-gray-300'
                            } transition-all duration-300`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const UserProfile = ({ userData }: { userData: SignupFormData }) => (
    <div className="space-y-2">
        <h1 className="text-4xl font-bold">
            Welcome, {userData.firstName}!
        </h1>
        {/* <p className="text-lg text-gray-600">
            Registered email: {userData.email}
        </p> */}
        {/* <div className="divider" /> */}
    </div>
);


const LoadingSkeleton = () => (
    <div className="max-w-4xl w-full space-y-8 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="mask mask-squircle w-32 h-32 bg-gray-200" />
            <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-64" />
            </div>
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
);

const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error">User not found</p>
    </div>
);


const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const AvatarPhoto = () => {
    const { userData, loading } = useUser();
    const avatarSize = 68;
    return (
        <div className='flex flex-col items-center space-y-2'>
            <div className="avatar">
                {loading ? (
                    <div className={`mask mask-squircle w-${avatarSize}`}>
                        <div className={`skeleton h-${avatarSize} w-${avatarSize} rounded-md`}></div>
                    </div>
                ) : (
                    <div className={`mask mask-squircle w-${avatarSize}`}>
                        {userData && userData.photoURL ? (
                            <Image
                                src={userData.photoURL}
                                width={avatarSize}
                                height={avatarSize}
                                alt="Avatar"
                                priority
                            />
                        ) : (
                            <CameraIcon width={avatarSize} height={avatarSize} />
                        )}
                    </div>
                )}
            </div>
            <div>
                {loading ? (
                    <div className="flex flex-col gap-4">
                        <div className="skeleton h-4 w-72 rounded-md"></div>
                    </div>
                ) : (
                    <div>
                        {userData && userData.lastName && userData.firstName && userData.username ? (
                            <div className="flex flex-col">
                                <div className="text-secondary-content">
                                    {capitalizeFirstLetter(userData.firstName)} {capitalizeFirstLetter(userData.lastName)}
                                </div>
                                <div className="text-gray-500">
                                    {userData.username}
                                </div>
                            </div>
                        ) : (
                            <p>User not found</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}


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

    if (loading) return <LoadingSkeleton />;
    if (!userData) return <UserNotFound />;

    return (
        <div className="flex flex-row flex-start gap-8 p-2">
            <section className="w-2/3 flex flex-col min-h-screen">
                {userData?.firstName ? (
                    <div className="flex flex-col items-left gap-4">
                        {/* <AvatarSection photoURL={userData?.photoURL} /> */}
                        <UserProfile userData={{
                            firstName: userData.firstName,
                            username: userData.username || '',
                            email: userData.email || '',
                            photoURL: userData.photoURL
                        }} />
                        
                    </div>
                ) : (
                    <UserNotFound />
                )}
                <div className="w-full">
                    <CalendarPage />
                </div>
            </section >
            <section className="card w-1/3 bg-secondary p-4">
                <div className="flex flex-col items-center space-y-12">
                    <AvatarPhoto />
                    <KidsGrid parentId={userData.uid} />
                </div>
            </section>
        </div >
    );
}
