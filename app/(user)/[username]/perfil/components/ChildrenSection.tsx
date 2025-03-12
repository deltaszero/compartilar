'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getUserChildren } from "@/lib/firebaseConfig";
import { useUser } from '@/context/userContext';
import { KidInfo } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export const ChildCard = ({ child }: { child: KidInfo }) => {
    const getAgeText = (birthDateStr: string) => {
        try {
            const birthDate = new Date(birthDateStr);
            const today = new Date();
            
            let years = today.getFullYear() - birthDate.getFullYear();
            const months = today.getMonth() - birthDate.getMonth();
            
            if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
                years--;
            }
            
            if (years < 1) {
                // Calculate months for babies
                const monthAge = months + (months < 0 ? 12 : 0);
                return `${monthAge} ${monthAge === 1 ? 'mês' : 'meses'}`;
            }
            
            return `${years} ${years === 1 ? 'ano' : 'anos'}`;
        } catch (e) {
            return "Idade não disponível";
        }
    };

    // const getRelationshipText = (relationship: string | null) => {
    //     if (!relationship) return "Relação não especificada";
        
    //     switch (relationship) {
    //         case "biological": return "Filho(a) Biológico(a)";
    //         case "adopted": return "Filho(a) Adotivo(a)";
    //         case "guardian": return "Sob Guarda";
    //         default: return "Relação não especificada";
    //     }
    // };

    // const getGenderText = (gender: string | null) => {
    //     if (!gender) return "";
        
    //     switch (gender) {
    //         case "male": return "Menino";
    //         case "female": return "Menina";
    //         case "other": return "";
    //         default: return "";
    //     }
    // };

    return (
        <Card className="overflow-hidden bg-card shadow-md rounded-xl border-2 border-border hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col sm:flex-row">
                <div className="relative sm:h-32 sm:h-auto bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border">
                    {child.photoURL ? (
                        <Image
                            src={child.photoURL}
                            alt={`${child.firstName}'s photo`}
                            width={256}
                            height={256}
                            className="w-full h-full object-fill "
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary/70">
                                {child.firstName[0].toUpperCase()}
                                {child.lastName[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col p-4 flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">{child.firstName} {child.lastName}</h3>
                            <p className="text-sm text-gray-400">{getAgeText(child.birthDate)}</p>
                        </div>
                        {child.accessLevel && (
                            <Badge 
                                variant="default" 
                                className={`ml-auto ${
                                    child.accessLevel === 'editor' 
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                            >
                                {child.accessLevel === 'editor' ? 'Editor' : 'Visualizador'}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export const NoChildrenMessage = () => (
    <div className="text-center p-6 bg-muted/30 rounded-xl border border-border">
        <h3 className="text-lg font-medium mb-2">Nenhuma criança cadastrada</h3>
        <p className="text-gray-400">
            Não há crianças vinculadas a este perfil.
        </p>
    </div>
);

export const ChildrenGrid = ({ 
    userId, 
    isOwnProfile, 
    friendshipStatus 
}: { 
    userId: string, 
    isOwnProfile: boolean,
    friendshipStatus?: 'none' | 'pending' | 'friend' | 'support' | 'coparent' | 'other' | 'self'
}) => {
    const [children, setChildren] = useState<KidInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const { username } = useParams<{ username: string }>();
    const { user, userData } = useUser();
    
    // Get the current user's username (for navigation)
    const currentUserUsername = userData?.username || '';

    // Determine if the current user has permission to view children
    const canViewChildren = isOwnProfile || 
        friendshipStatus === 'friend' || 
        friendshipStatus === 'support' || 
        friendshipStatus === 'coparent';

    useEffect(() => {
        const fetchChildren = async () => {
            if (!userId) return;
            
            // Only fetch children if user has permission or is the profile owner
            if (!canViewChildren) {
                setLoading(false);
                return;
            }
            
            try {
                // Get the current user's ID
                const currentUserId = user?.uid || '';
                
                if (!currentUserId) {
                    console.error("Current user ID not available");
                    setLoading(false);
                    return;
                }
                
                console.log(`Fetching children for profile ${userId}, current user: ${currentUserId}`);
                console.log(`Relationship status: ${friendshipStatus}, isOwnProfile: ${isOwnProfile}`);
                
                // Use the API to fetch children
                const response = await fetch(`/api/profile/children?userId=${userId}&currentUserId=${currentUserId}&relationshipStatus=${friendshipStatus || 'none'}`);
                
                if (!response.ok) {
                    // Handle 403/permission denied gracefully
                    if (response.status === 403) {
                        console.log('Permission denied to view children');
                        setLoading(false);
                        return;
                    }
                    
                    throw new Error(`Failed to fetch children: ${response.status}`);
                }
                
                const childrenData = await response.json();
                console.log(`Found ${childrenData.length} children for user`);
                
                // The API already formats the data correctly, so we can use it directly
                setChildren(childrenData);
            } catch (error) {
                console.error("Error fetching children:", error);
                // Set empty array on error
                setChildren([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChildren();
    }, [userId, canViewChildren, user?.uid, isOwnProfile, friendshipStatus]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // If the user doesn't have permission to view children
    if (!canViewChildren && !isOwnProfile) {
        return (
            <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <h3 className="text-xl font-semibold">Crianças</h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-6 bg-muted/30 rounded-xl">
                        <h3 className="text-lg font-medium mb-2">Conteúdo restrito</h3>
                        <p className="text-gray-400">
                            Você precisa ser amigo ou fazer parte da rede de apoio para visualizar as crianças.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="text-xl font-semibold">Crianças</h3>
                {isOwnProfile && (
                    <Link href={`/${username}/criancas/novo`}>
                        <Button variant="default" size="sm" className="rounded-md bg-mainStrongGreen">
                            <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                    </Link>
                )}
            </CardHeader>
            <CardContent>
                {children.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {children.map((child) => (
                            <Link 
                                href={`/${currentUserUsername}/criancas/${child.id}`} 
                                key={child.id} 
                                className="block hover:transform hover:scale-[1.01] transition-transform"
                            >
                                <ChildCard child={child} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <NoChildrenMessage />
                )}
            </CardContent>
            {children.length > 0 && isOwnProfile && (
                <CardFooter className="flex justify-center border-t border-border pt-4">
                    <Link href={`/${username}/criancas`}>
                        <Button variant="default" className="rounded-md">
                            Gerenciar Crianças
                        </Button>
                    </Link>
                </CardFooter>
            )}
        </Card>
    );
};

export default ChildrenGrid;