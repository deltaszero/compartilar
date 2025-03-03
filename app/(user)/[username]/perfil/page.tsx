// app/(user)/[username]/perfil/page.tsx
'use client';
import { useEffect, useState } from 'react';
// import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@context/userContext';
import LoadingPage from '@/app/components/LoadingPage';
// import CameraIcon from '@assets/icons/camera.svg';
import { motion } from 'framer-motion';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { checkFriendshipStatus, FriendshipStatus, getUserByUsername } from '@/app/lib/firebaseConfig';
import toast from 'react-hot-toast';

// shadcn components
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <p className="text-xl text-destructive uppercase">
            User not found
        </p>
    </div>
);

const AccessDenied = () => (
    <div className="flex flex-1 flex-col items-center justify-center p-8 gap-4">
        <p className="text-xl text-destructive font-semibold text-center">
            Acesso Negado
        </p>
        <p className="text-center text-muted-foreground">
            Você precisa ser amigo ou familiar para visualizar este perfil.
        </p>
    </div>
);

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const AvatarSection = ({ photoURL, firstName, lastName }: { photoURL?: string, firstName?: string, lastName?: string }) => (
    <motion.div
        className="flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
        <Avatar className="h-48 w-48 rounded-xl border-2 border-border shadow-md">
            {photoURL ? (
                <AvatarImage src={photoURL} alt={`${firstName || 'User'}'s avatar`} />
            ) : (
                <AvatarFallback className="bg-muted text-2xl">
                    {firstName?.charAt(0)}{lastName?.charAt(0)}
                </AvatarFallback>
            )}
        </Avatar>
    </motion.div>
);

const UserProfileCard = ({ userData, isOwnProfile }: { userData: Partial<SignupFormData>, isOwnProfile: boolean }) => (
    <Card className="mx-auto w-full max-w-md bg-card shadow-md">
        <CardHeader className="flex flex-col items-center pb-2">
            <AvatarSection 
                photoURL={userData?.photoURL} 
                firstName={userData.firstName} 
                lastName={userData.lastName}
            />
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center pt-4">
            <h2 className="text-2xl font-semibold mb-1">
                {capitalizeFirstLetter(userData.firstName || '')} {capitalizeFirstLetter(userData.lastName || '')}
            </h2>
            <p className="text-muted-foreground">
                @{userData.username}
            </p>
            {!isOwnProfile && (
                <Badge variant="secondary" className="mt-4">
                    Perfil Visitante
                </Badge>
            )}
        </CardContent>
    </Card>
);

const RelationshipBadge = ({ status }: { status: FriendshipStatus }) => {
    const getBadgeVariant = () => {
        switch (status) {
            case 'coparent':
                return 'secondary';
            case 'support':
                return 'info';
            case 'other':
                return 'default';
            default:
                return 'default';
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
        <Badge variant={getBadgeVariant() as "default" | "secondary" | "destructive" | "outline" } className="mt-2">
            {getRelationshipText()}
        </Badge>
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
            
            {/* PROFILE CONTENT */}
            <div className="w-full p-4 max-w-3xl mx-auto">
                <UserProfileCard userData={profileData} isOwnProfile={isOwnProfile} />
                
                {/* Only show relationship badge for other people's profiles */}
                {!isOwnProfile && (
                    <div className="flex justify-center mt-4">
                        <RelationshipBadge status={friendshipStatus} />
                    </div>
                )}
                
                {/* Additional profile sections go here */}
                <div className="mt-8">
                    {/* These sections would only appear with editing capabilities on own profile */}
                    {/* For other profiles, they would be view-only */}
                </div>
            </div>
        </div>
    );
}