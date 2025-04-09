'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { toast } from '@/hooks/use-toast';
import { KidInfo } from '../types';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { fetchChildData } from './services/child-api';
import { Button } from '@/components/ui/button';
import { Edit, History, Users, UserIcon } from 'lucide-react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { HistoryList } from './components/HistoryList';
import { PermissionsList } from './components/PermissionsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * ChildProfile component
 * Displays essential child information, change history, and permissions management
 */
export default function ChildProfile() {
    const { username, kid } = useParams<{ username: string; kid: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();
    
    // Child data and status state
    const [childData, setChildData] = useState<KidInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditor, setIsEditor] = useState(false);

    // Load initial child data
    useEffect(() => {
        const loadChildData = async () => {
            if (!user || !userData) {
                router.push('/login');
                return;
            }

            try {
                setIsLoading(true);
                const token = await user.getIdToken(true);
                const childInfo = await fetchChildData(kid as string, token);

                setChildData(childInfo);

                // Determine access level
                const editors = childInfo.editors || [];
                if (childInfo.createdBy === user.uid || childInfo.owner === user.uid) {
                    setIsOwner(true);
                    setIsEditor(true); // Owner automatically has editor permissions
                } else if (editors.includes(user.uid)) {
                    setIsEditor(true);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching child data:', error);

                if (error instanceof Error) {
                    if (error.message === 'child_not_found') {
                        toast({
                            variant: 'destructive',
                            title: 'Criança não encontrada',
                            description: 'Os dados solicitados não existem.'
                        });
                    } else if (error.message === 'access_denied') {
                        toast({
                            variant: 'destructive',
                            title: 'Acesso negado',
                            description: 'Você não tem permissão para ver esta informação.'
                        });
                        router.push(`/${username}/home`);
                        return;
                    }
                }

                router.push(`/${username}/criancas`);
            }
        };

        if (!loading) {
            loadChildData();
        }
    }, [user, userData, kid, username, router, loading]);

    // Navigate to edit page
    const handleEditProfile = () => {
        router.push(`/${username}/criancas/${kid}/editar`);
    };

    // Calculate child's age
    const calculateAge = (birthDateStr: string) => {
        try {
            const birthDate = new Date(birthDateStr);
            const today = new Date();

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return `${age} ${age === 1 ? 'ano' : 'anos'}`;
        } catch (e) {
            return 'Idade indisponível';
        }
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!childData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold">Criança não encontrada</h1>
                <p className="mt-2 text-gray-600">Os dados solicitados não existem ou você não tem permissão para acessá-los.</p>
                <Button className="mt-4" onClick={() => router.push(`/${username}/criancas`)}>
                    Voltar para a lista
                </Button>
            </div>
        );
    }

    return (
        <div>
            <UserProfileBar pathname='Perfil de Criança' />
            <div className="p-4 max-w-2xl mx-auto">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 border-2 border-black overflow-hidden">
                        <TabsTrigger value="profile">
                            Perfil
                        </TabsTrigger>
                        <TabsTrigger value="permissions">
                            <Users className="h-4 w-4 mr-2" />
                            Permissões
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="h-4 w-4 mr-2" />
                            Histórico
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile">
                        <div className="flex flex-col items-center bg-white p-6 border-2 border-black shadow-brutalist">
                            {/* Child Photo */}
                            <div className="relative w-48 h-48 rounded-xl border-2 border-blank overflow-hidden mb-4 bg-bg">
                                {childData.photoURL ? (
                                    <Image
                                        src={childData.photoURL}
                                        alt={`${childData.firstName} ${childData.lastName}`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-6xl font-bold font-raleway">
                                            {childData.firstName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Child Name */}
                            <h1 className="text-2xl font-bold text-center">
                                {childData.firstName} {childData.lastName}
                            </h1>

                            {/* Child Age */}
                            {childData.birthDate && (
                                <Badge className='flex flex-row items-center gap-1 rounded-xl bg-blank text-bw text-sm' variant="default" >
                                    {calculateAge(childData.birthDate)}
                                </Badge>
                            )}

                            {/* Child Description/Notes */}
                            {childData.notes && (
                                <div className="mt-4 text-center">
                                    <p className="whitespace-pre-wrap">{childData.notes}</p>
                                </div>
                            )}

                            {/* Edit Button - only if user has permission */}
                            {(isOwner || isEditor) && (
                                <Button 
                                    className="mt-6 sm:w-auto bg-mainStrongGreen"
                                    onClick={handleEditProfile}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Perfil
                                </Button>
                            )}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="permissions">
                        <div className="bg-white border-2 border-black shadow-brutalist">
                            <PermissionsList childId={childData.id} user={user} isOwner={isOwner} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="history">
                        <div className="bg-white border-2 border-black shadow-brutalist">
                            <HistoryList childId={childData.id} user={user} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}