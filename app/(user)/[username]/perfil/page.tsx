// app/(user)/[username]/perfil/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@context/userContext';
import LoadingPage from '@/app/components/LoadingPage';
import CameraIcon from '@assets/icons/camera.svg';
import { motion } from 'framer-motion';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { checkFriendshipStatus, FriendshipStatus, getUserByUsername } from '@/app/lib/firebaseConfig';
import toast from 'react-hot-toast';

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
    uid?: string;
}

const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error uppercase">
            User not found
        </p>
    </div>
);

const AccessDenied = () => (
    <div className="flex flex-1 flex-col items-center justify-center p-8 gap-4">
        <p className="text-xl text-error font-semibold text-center">
            Acesso Negado
        </p>
        <p className="text-center text-gray-600">
            Você precisa ser amigo ou familiar para visualizar este perfil.
        </p>
    </div>
);

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

const UserProfileCard = ({ userData, isOwnProfile }: { userData: Partial<SignupFormData>, isOwnProfile: boolean }) => (
    <div className="flex flex-col items-center justify-center bg-base-100 rounded-3xl shadow-xl mx-auto py-4">
        <AvatarSection photoURL={userData?.photoURL} />
        <div className="flex flex-col gap-0 items-center justify-center font-playfair">
            <div className="text-2xl font-semibold">
                {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
            </div>
            <div className="text-gray-500 font-raleway">
                @{userData.username}
            </div>
            {!isOwnProfile && (
                <div className="mt-4 badge badge-primary">Perfil Visitante</div>
            )}
        </div>
    </div>
);

const RelationshipBadge = ({ status }: { status: FriendshipStatus }) => {
    const getBadgeClass = () => {
        switch (status) {
            case 'coparent':
                return 'badge-secondary';
            case 'support':
                return 'badge-primary';
            case 'other':
                return 'badge-neutral';
            default:
                return 'badge-neutral';
        }
    };

    const getRelationshipText = () => {
        switch (status) {
            case 'coparent':
                return 'Co-Parent';
            case 'support':
                return 'Rede de Apoio';
            case 'other':
                return 'Contato';
            default:
                return 'Contato';
        }
    };

    return (
        <div className={`badge ${getBadgeClass()} gap-2 mt-2`}>
            {getRelationshipText()}
        </div>
    );
};

export default function UserProfilePage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();
    const [profileData, setProfileData] = useState<Partial<SignupFormData> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
    const [userNotFound, setUserNotFound] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                // Not logged in
                router.push('/login');
                return;
            }

            if (!username) {
                router.push('/home');
                return;
            }

            // Check if this is the current user's profile
            if (userData?.username === username) {
                setProfileData(userData);
                setFriendshipStatus('self');
                setIsLoading(false);
                return;
            }

            // Fetch the other user's profile data
            try {
                const otherUserData = await getUserByUsername(username as string);
                
                if (!otherUserData) {
                    setUserNotFound(true);
                    setIsLoading(false);
                    return;
                }

                // Check friendship status
                const status = await checkFriendshipStatus(user.uid, otherUserData.uid);
                setFriendshipStatus(status);
                
                if (status === 'none') {
                    // No friendship, redirect to home
                    toast.error('Você precisa ser amigo para visualizar este perfil');
                    router.push('/home');
                    return;
                }

                setProfileData(otherUserData);
            } catch (error) {
                console.error('Error checking access:', error);
                toast.error('Erro ao verificar acesso ao perfil');
                router.push('/home');
            } finally {
                setIsLoading(false);
            }
        };

        if (!loading) {
            checkAccess();
        }
    }, [user, userData, loading, username, router]);

    if (isLoading) return <LoadingPage />;
    if (userNotFound) return <UserNotFound />;
    if (friendshipStatus === 'none') return <AccessDenied />;
    if (!profileData) return <LoadingPage />;

    const isOwnProfile = friendshipStatus === 'self';

    return (
        <div className="flex flex-col items-start overflow-hidden h-screen">
            {/* NAVBAR */}
            <UserProfileBar pathname={isOwnProfile ? "Meu Perfil" : `Perfil de ${capitalizeFirstLetter(profileData.firstName || '')}`} />
            {/* PROFILE BAR */}
            <div className='w-full p-2'>
                <UserProfileCard userData={profileData} isOwnProfile={isOwnProfile} />
                
                {/* Only show relationship badge for other people's profiles */}
                {!isOwnProfile && (
                    <div className="flex justify-center mt-4">
                        <RelationshipBadge status={friendshipStatus} />
                    </div>
                )}
                
                {/* Additional profile sections go here */}
                <div className="mt-8 px-4">
                    {/* These sections would only appear with editing capabilities on own profile */}
                    {/* For other profiles, they would be view-only */}
                </div>
            </div>
        </div>
    );
}