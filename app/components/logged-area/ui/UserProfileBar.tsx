'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Bell, Camera, Settings, Home, LogOut, Search, UserPlus, X } from "lucide-react";
import { cn } from '@/app/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
// import path from 'path';

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

interface UserNavbarProps {
    pathname: string;
    onBackClick?: () => void;
    userData: {
        username: string;
        photoURL?: string;
        uid?: string;
    } | null;
}

interface SearchResult {
    uid: string;
    username: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

/**
 * NotificationBell component for displaying notifications
 */
const NotificationBell = () => (
    <Button 
        variant="default" 
        size="icon"
        className="relative h-9 w-9 rounded-md"
    >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondaryMain text-[10px] font-medium text-primary-foreground ring-1 ring-background">
            9+
        </span>
        <span className="sr-only">Notifications</span>
    </Button>
);

/**
 * UserMenu component for the user dropdown
 */
const UserMenu = ({ userData, onSignOut }: {
    userData: { username: string; photoURL?: string; },
    onSignOut: () => void
}) => (
    <div className="flex items-center gap-2">
        {/* Username - hidden on mobile */}
        <span className="hidden sm:block text-lg font-medium">
            {userData.username}
        </span>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-primary">
                        {userData.photoURL ? (
                            <AvatarImage src={userData.photoURL} alt="Avatar" />
                        ) : (
                            <AvatarFallback className="bg-primary-foreground text-primary">
                                <Camera className="h-5 w-5" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                    <Link href={`/${userData.username}/home`} className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/${userData.username}/settings`} className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSignOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);

/**
 * FriendSearch component
 */
const FriendSearch = ({ userData }: { userData: { username: string; photoURL?: string; uid?: string; } }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState<{[key: string]: boolean}>({});
    const [selectedRelationship, setSelectedRelationship] = useState<'support' | 'coparent' | 'other'>('support');
    
    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 3) return;
        
        setIsSearching(true);
        setSearchResults([]);
        
        try {
            // This is just mock data, actual implementation would use Firebase Firestore
            // (similar to original FriendSearch.tsx implementation)
            setTimeout(() => {
                const mockResults = [
                    {
                        uid: 'user1',
                        username: 'maria',
                        firstName: 'Maria',
                        lastName: 'Silva',
                        photoURL: 'https://i.pravatar.cc/150?img=1'
                    },
                    {
                        uid: 'user2',
                        username: 'joao',
                        firstName: 'João',
                        lastName: 'Santos',
                        photoURL: 'https://i.pravatar.cc/150?img=2'
                    }
                ].filter(user => 
                    user.username.includes(searchTerm.toLowerCase()) && 
                    user.uid !== userData.uid
                );
                
                setSearchResults(mockResults);
                setIsSearching(false);
                
                if (mockResults.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "Nenhum resultado",
                        description: "Nenhum usuário encontrado com esse nome"
                    });
                }
            }, 500);
            
        } catch (error) {
            console.error('Search error:', error);
            toast({
                variant: "destructive",
                title: "Erro na busca",
                description: "Erro ao buscar usuários"
            });
            setIsSearching(false);
        }
    };
    
    const sendFriendRequest = (receiver: SearchResult) => {
        if (!userData.uid) {
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: "Você precisa estar logado para enviar solicitações"
            });
            return;
        }
        
        setIsSending(prev => ({ ...prev, [receiver.uid]: true }));
        
        // Mock implementation - would use Firebase in actual code
        setTimeout(() => {
            toast({
                title: "Solicitação enviada",
                description: "Solicitação de amizade enviada com sucesso"
            });
            setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
            
            // Remove from results
            setSearchResults(prev => prev.filter(user => user.uid !== receiver.uid));
            
            if (searchResults.length <= 1) {
                // Reset search term but don't close search
                setSearchTerm('');
                setSearchResults([]);
            }
        }, 800);
    };
    
    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
    };
    
    return (
        <div className="flex flex-1 max-w-md relative">
            <div className="flex items-start w-full">
                <div className="flex items-start relative w-full">
                    <Input
                        type="text"
                        placeholder="Buscar amigos por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full border-2 h-9 sm:pr-10"
                    />
                    {searchTerm && (
                        <Button 
                            variant={null}
                            size="icon" 
                            className="absolute right-0 top-0 h-9 w-9"
                            onClick={clearSearch}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button 
                    variant="default" 
                    size="icon"
                    className="h-9 w-10 ml-2"
                    onClick={handleSearch}
                    disabled={isSearching || searchTerm.length < 3}
                >
                    {isSearching ? (
                        <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                        <Search className="h-5 w-5" strokeWidth={2.5} />
                        
                    )}
                </Button>
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
                <Card className="absolute top-full mt-1 w-full z-[999] p-2 max-h-[300px] overflow-y-auto shadow-lg border-2">
                    <div className="flex gap-2 mb-2 flex-wrap px-2">
                        <Badge 
                            variant={selectedRelationship === 'support' ? 'default' : 'neutral'}
                            className="cursor-pointer"
                            onClick={() => setSelectedRelationship('support')}
                        >
                            Rede de Apoio
                        </Badge>
                        <Badge 
                            variant={selectedRelationship === 'coparent' ? 'default' : 'neutral'}
                            className="cursor-pointer"
                            onClick={() => setSelectedRelationship('coparent')}
                        >
                            Co-Parental
                        </Badge>
                        <Badge 
                            variant={selectedRelationship === 'other' ? 'default' : 'neutral'}
                            className="cursor-pointer"
                            onClick={() => setSelectedRelationship('other')}
                        >
                            Outro
                        </Badge>
                    </div>
                    
                    <div className="space-y-2">
                        {searchResults.map((result) => (
                            <div key={result.uid} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-primary">
                                        {result.photoURL ? (
                                            <AvatarImage src={result.photoURL} alt={result.username} />
                                        ) : (
                                            <AvatarFallback className="bg-primary-foreground text-primary">
                                                {result.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{result.username}</p>
                                        {result.firstName && result.lastName && (
                                            <p className="text-xs text-muted-foreground">
                                                {result.firstName} {result.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="neutral"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => sendFriendRequest(result)}
                                    disabled={isSending[result.uid]}
                                >
                                    {isSending[result.uid] ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                    ) : (
                                        <UserPlus className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Adicionar</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

/**
 * Main UserNavbar component
 */
const UserNavbar = ({ pathname, onBackClick, userData }: UserNavbarProps) => {
    console.log(pathname);
    const router = useRouter();
    
    const handleSignOut = async () => {
        try {
            // Add your signout logic here
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    return (
        <header className={cn(
            "flex items-start justify-between bg-bg py-4 px-2",
            "border-b sticky top-0 z-[999] w-full gap-2"
        )}>
            <div className="flex items-start min-w-[44px]">
                <Button 
                    variant="default"
                    size="icon" 
                    className="bg-bw rounded-md w-9 h-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={onBackClick}
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                    <span className="sr-only">Voltar</span>
                </Button>
            </div>
            
            {/* Center section with search */}
            {userData && (
                <div className="mx-2 flex-1">
                    <FriendSearch userData={userData} />
                </div>
            )}
            
            {/* Right section with user menu and notifications */}
            {userData && (
                <div className="flex items-start gap-2">
                    <UserMenu 
                        userData={userData} 
                        onSignOut={handleSignOut} 
                    />
                    <NotificationBell />
                </div>
            )}
        </header>
    );
};

/**
 * UserNotFound component for when user data is missing
 */
const UserNotFound = () => (
    <header className={cn(
        "flex items-center justify-between bg-bg py-3 px-4 md:px-6",
        "border-b sticky top-0 z-[999] w-full"
    )}>
        <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-medium text-foreground">
                Error
            </h1>
        </div>
        
        <div className="flex items-center">
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-md">
                User not found
            </p>
        </div>
    </header>
);

/**
 * UserProfileBar is the main exported component
 */
const UserProfileBar = ({ pathname }: { pathname: string }) => {
    const { userData } = useUser();
    const router = useRouter();
    
    const handleBackClick = () => {
        router.back();
    };
    
    if (!userData) return <UserNotFound />;
    
    return (
        <>
            <UserNavbar 
                pathname={pathname} 
                onBackClick={handleBackClick}
                userData={userData}
            />
            <Toaster />
        </>
    );
};

export default UserProfileBar;