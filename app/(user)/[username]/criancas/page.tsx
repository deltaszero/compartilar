'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { db, checkFriendshipStatus, getUserChildren } from '@/lib/firebaseConfig';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { toast } from '@/hooks/use-toast';
import ChildrenCarousel from './components/ChildrenCarousel';
// import ChildrenGrid from './components/ChildrenGrid';
import { KidInfo } from './types';
import { auth } from '@/lib/firebaseConfig';

export default function ChildrenPage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();
    const [children, setChildren] = useState<KidInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnChildren, setIsOwnChildren] = useState(false);
    const [ownerData, setOwnerData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !userData) {
                router.push('/login');
                return;
            }

            try {
                // Check if viewing own profile or someone else's
                let targetUserId: string;
                let targetUserData: any;

                // If viewing own username
                if (userData.username === username) {
                    setIsOwnChildren(true);
                    targetUserId = userData.uid;
                    targetUserData = userData;
                    setOwnerData(userData);
                } else {
                    // Get the target user data via API
                    const idToken = await auth.currentUser?.getIdToken();
                    const response = await fetch(`/api/users/search?term=${username}&exact=true`, {
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to get user data');
                    }
                    
                    const users = await response.json();
                    
                    if (!users || users.length === 0) {
                        toast({
                            variant: 'destructive',
                            title: 'Usuário não encontrado',
                            description: 'O usuário solicitado não existe.'
                        });
                        router.push('/home');
                        return;
                    }

                    const targetUser = users[0];
                    targetUserId = targetUser.uid;
                    targetUserData = targetUser;
                    setOwnerData(targetUserData);

                    // Check friendship status via API
                    const friendshipResponse = await fetch(`/api/friends/relationship?userId=${user.uid}&friendId=${targetUserId}`, {
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    if (!friendshipResponse.ok) {
                        throw new Error('Failed to check friendship status');
                    }
                    
                    const friendshipData = await friendshipResponse.json();
                    
                    if (friendshipData.status === 'none') {
                        toast({
                            variant: 'destructive',
                            title: 'Acesso negado',
                            description: 'Você precisa ser amigo para ver as crianças deste usuário.'
                        });
                        router.push('/home');
                        return;
                    }
                }

                // Fetch children data via API
                const idToken = await auth.currentUser?.getIdToken();
                
                // We need to pass both the target userId and the current userId to the API
                const response = await fetch(`/api/profile/children?userId=${targetUserId}&currentUserId=${user.uid}&relationshipStatus=${targetUserId === user.uid ? 'self' : 'friend'}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error fetching children data:', errorData);
                    throw new Error(`Failed to fetch children data: ${errorData.message || 'Unknown error'}`);
                }
                
                const childrenData = await response.json();

                // Convert the data to match our KidInfo interface
                const formattedChildrenData = childrenData.map((child: any) => {
                    return {
                        id: child.id,
                        ...child
                    } as KidInfo;
                });

                setChildren(formattedChildrenData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'Ocorreu um erro ao carregar os dados. Tente novamente.'
                });
                setIsLoading(false);
            }
        };

        if (!loading) {
            fetchData();
        }
    }, [user, userData, username, router, loading]);

    if (isLoading || loading) {
        return <LoadingPage />;
    }

    const pageTitle = isOwnChildren ? 'Minhas Crianças' : `Crianças de ${ownerData?.firstName || 'Usuário'}`;

    return (
        <div>
            <UserProfileBar pathname={pageTitle} />
            <div className="flex flex-col p-4 sm:p-6 pb-[6em]">

                <div className="mb-4 sm:mb-6 border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist inline-block">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-raleway">
                        Crianças
                    </h1>
                    <p className="mt-1 text-sm sm:text-base font-nunito">
                        Adicione e edite informações sobre suas filhas e filhos.
                    </p>
                </div>


                <div className="flex-1 w-full max-w-5xl mx-auto p-4 pb-20">


                    {/* Carousel */}
                    <ChildrenCarousel
                        children={children}
                        isLoading={isLoading}
                        isOwnChildren={isOwnChildren}
                    />

                    {/* Children Grid */}
                    {/* <ChildrenGrid
            children={children}
            isLoading={isLoading}
            isOwnChildren={isOwnChildren}
          /> */}
                </div>
            </div>
        </div>
    );
}