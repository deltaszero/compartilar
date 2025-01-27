// app/(user)/[username]/page.tsx
'use client';
// imoprting built-in modules
import { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CameraIcon from '@assets/icons/camera.svg';

export interface SignupFormData {
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
<article className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
    <div className="card-body">
        <h3 className="card-title text-lg">
            {kid.firstName} {kid.lastName}
        </h3>
        <dl className="space-y-2">
            <div>
                <dt className="text-sm text-gray-500">Birth Date</dt>
                <dd className="font-medium">{kid.birthDate}</dd>
            </div>
            {kid.gender && (
                <div>
                    <dt className="text-sm text-gray-500">Gender</dt>
                    <dd className="font-medium capitalize">{kid.gender}</dd>
                </div>
            )}
        </dl>
        <div className="card-actions justify-end">
            <button className="btn btn-ghost text-primary">
                View Details
            </button>
        </div>
    </div>
</article>
);



const KidsGrid = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
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

    if (loading) return <div className="text-center py-4">Loading children...</div>;
    if (!kidsArray.length) return null;

    return (
        <section>
            <h2 className="text-2xl font-semibold mb-6">Children Profiles</h2>
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
            <div>
                {kidsArray.map((kid) => (
                    <ChildCard key={kid.id} kid={kid} />
                ))}
            </div>
        </section>
    );
};


const UserProfile = ({ userData }: { userData: SignupFormData }) => (
    <div className="space-y-2">
        <h1 className="text-4xl font-bold">
            Welcome, {userData.username}!
        </h1>
        <p className="text-lg text-gray-600">
            Registered email: {userData.email}
        </p>
        <div className="divider" />
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
                {userData ? (
                    <div className="flex flex-col items-left gap-4">
                        {/* <AvatarSection photoURL={userData?.photoURL} /> */}
                        <UserProfile userData={userData} />
                        
                    </div>
                ) : (
                    <UserNotFound />
                )}
            </section >
            <section className="card w-1/3 bg-yellow-500 p-4">
                <KidsGrid parentId={userData.uid} />
            </section>
        </div >
    );
}
