'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, checkFriendshipStatus, getUserChildren } from '@/lib/firebaseConfig';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { toast } from '@/hooks/use-toast';
import ChildrenCarousel from './components/ChildrenCarousel';
// import ChildrenGrid from './components/ChildrenGrid';
import { KidInfo } from './types';

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
                    // Get the target user data and check friendship
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('username', '==', username));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        toast({
                            variant: 'destructive',
                            title: 'Usuário não encontrado',
                            description: 'O usuário solicitado não existe.'
                        });
                        router.push('/home');
                        return;
                    }

                    const targetUser = querySnapshot.docs[0];
                    targetUserId = targetUser.id;
                    targetUserData = { id: targetUser.id, ...targetUser.data() };
                    setOwnerData(targetUserData);

                    // Check friendship status
                    const status = await checkFriendshipStatus(user.uid, targetUserId);
                    if (status === 'none') {
                        toast({
                            variant: 'destructive',
                            title: 'Acesso negado',
                            description: 'Você precisa ser amigo para ver as crianças deste usuário.'
                        });
                        router.push('/home');
                        return;
                    }
                }

                // Fetch children data using the getUserChildren function
                // This function handles permission logic by querying based on viewers/editors arrays
                const childrenData = await getUserChildren(targetUserId);
                
                // Convert the data to match our KidInfo interface
                const formattedChildrenData = childrenData.map(child => {
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
                <div className="flex-1 w-full max-w-5xl mx-auto p-4 pb-20">
                    <div className="w-full mb-4 sm:mb-6 border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist inline-block">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Crianças</h1>
                        <p className="mt-1 text-sm sm:text-base">
                            Adicione e edite informações sobre suas filhas e filhos.
                        </p>
                        <p className="mt-1 text-sm sm:text-base">
                            Se você faz parte de uma rede de apoio, pode visualizar as informações das crianças da sua rede.
                        </p>
                    </div>

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