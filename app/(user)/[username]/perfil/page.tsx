'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/context/userContext';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { FriendshipStatus } from '@/lib/firebaseConfig';
import { toast } from '@/hooks/use-toast';

// Components
import UserProfileCard from './components/UserProfileCard';
import RelationshipBadge from './components/RelationshipBadge';
import { UserNotFound, AccessDenied } from './components/ErrorStates';
import { ProfileInfoSection, AboutSection, ActivitiesSection } from './components/InfoSections';
import ChildrenGrid from './components/ChildrenSection';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
import { SignupFormData } from './types';

// Helpers
const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export default function UserProfilePage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();
    const [profileData, setProfileData] = useState<Partial<SignupFormData> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
    const [userNotFound, setUserNotFound] = useState(false);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<SignupFormData>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
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
                // Type assertion to ensure gender is compatible with SignupFormData
                const typedUserData = {
                    ...userData,
                    gender: (userData.gender as 'male' | 'female' | 'other' | null)
                };
                setProfileData(typedUserData);
                setFormData(typedUserData); // Initialize form data
                setFriendshipStatus('self');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch profile data using the new API
                console.log(`Fetching profile data for username: ${username}`);
                const response = await fetch(`/api/profile?username=${username}&currentUserId=${user.uid}`);
                
                // Handle user not found
                if (response.status === 404) {
                    setUserNotFound(true);
                    setIsLoading(false);
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch profile: ${response.status}`);
                }
                
                const profileApiData = await response.json();
                
                // Check if we got a valid response
                if (!profileApiData || !profileApiData.uid) {
                    console.error('Invalid profile data received:', profileApiData);
                    setUserNotFound(true);
                    setIsLoading(false);
                    return;
                }
                
                // Extract friendship status from the response
                const status = profileApiData.friendshipStatus || 'none';
                setFriendshipStatus(status);
                
                // Type assertion to ensure compatibility with SignupFormData
                const typedProfileData = {
                    ...profileApiData,
                    // Only add gender cast if gender exists, otherwise use null
                    gender: profileApiData && 'gender' in profileApiData
                           ? (profileApiData.gender as 'male' | 'female' | 'other' | null)
                           : null
                } as Partial<SignupFormData>;
                
                setProfileData(typedProfileData);
                
                // Notify user about their relationship status if they're not friends
                if (status === 'none') {
                    toast({
                        title: "Visualização limitada",
                        description: "Você está visualizando informações públicas deste perfil"
                    });
                } else if (status === 'pending') {
                    toast({
                        title: "Solicitação pendente",
                        description: "Você tem uma solicitação de amizade pendente com este usuário"
                    });
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Erro ao carregar dados do perfil"
                });
                router.push('/home');
            } finally {
                setIsLoading(false);
            }
        };

        if (!loading) {
            fetchProfileData();
        }
    }, [user, userData, loading, username, router]);

    // Handle toggling edit mode
    const toggleEditMode = () => {
        if (isEditing) {
            // Reset form data when canceling edit
            setFormData(profileData || {});
        }
        setIsEditing(!isEditing);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { name: string, value: string }) => {
        if ('target' in e) {
            // Handle standard input changes
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            // Handle select changes
            const { name, value } = e;
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? null : value // Set empty selection to null
            }));
        }
    };

    // Handle saving profile changes using the API
    const saveProfileChanges = async () => {
        if (!user?.uid) return;

        setIsSaving(true);
        try {
            // Exclude sensitive fields from update
            const { password, confirmPassword, uid, username: usernameField, ...updateData } = formData;

            // Call the API to update the profile
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.uid,
                    updateData: updateData
                })
            });
            
            if (!response.ok) {
                // Try to get error details
                let errorMessage = 'Ocorreu um erro ao salvar seu perfil';
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // If error parsing fails, just use the default message
                }
                
                throw new Error(errorMessage);
            }
            
            // Update local state
            setProfileData(formData);

            // Show success message
            toast({
                title: "Perfil atualizado",
                description: "Suas informações foram salvas com sucesso"
            });

            // Exit edit mode
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            
            // Handle error with proper type checking
            let errorMessage = "Ocorreu um erro ao salvar seu perfil";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String(error.message);
            }
            
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: errorMessage
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Loading and error states
    if (isLoading) return <LoadingPage />;
    if (userNotFound) return <UserNotFound />;
    // We now allow viewing profiles even with 'none' status (limited view)
    if (!profileData) return <LoadingPage />;

    const isOwnProfile = friendshipStatus === 'self';

    return (
        <div>
            {/* NAVBAR */}
            <UserProfileBar pathname={isOwnProfile ? "Meu Perfil" : `Perfil de ${capitalizeFirstLetter(profileData.firstName || '')}`} />
            <div className="flex flex-col p-4 sm:p-6 pb-[6em]">

                {/* PROFILE CONTENT */}
                <div className="w-full p-4 max-w-3xl mx-auto mt-4 pb-20">
                    {/* <div className="w-full mb-4 sm:mb-6 border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist inline-block">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conversas</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Converse com sua rede de apoio
                        </p>
                    </div> */}

                    <UserProfileCard
                        userData={profileData}
                        isOwnProfile={isOwnProfile}
                        isEditing={isEditing && isOwnProfile}
                        formData={formData}
                        isSaving={isSaving}
                        onToggleEdit={toggleEditMode}
                        onSave={saveProfileChanges}
                        onChange={handleInputChange}
                    />

                    {/* Only show relationship badge for other people's profiles */}
                    {!isOwnProfile && (
                        <div className="flex justify-center mt-6 mb-2">
                            <RelationshipBadge status={friendshipStatus} />
                        </div>
                    )}

                    {/* Profile Tabs */}
                    <div className="mt-8 space-y-6">
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="info">Info</TabsTrigger>
                                <TabsTrigger value="kids">Crianças</TabsTrigger>
                                {/* <TabsTrigger value="activities">Atividades</TabsTrigger> */}
                            </TabsList>

                            <TabsContent value="info" className="space-y-4">
                                {isOwnProfile ? (
                                    <ProfileInfoSection
                                        email={isEditing ? formData.email : profileData.email}
                                        isEditing={isEditing}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <AboutSection
                                        about={profileData.about}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="kids">
                                <ChildrenGrid
                                    userId={profileData.uid || ''}
                                    isOwnProfile={isOwnProfile}
                                    friendshipStatus={friendshipStatus}
                                />
                            </TabsContent>

                            <TabsContent value="activities">
                                <ActivitiesSection />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}