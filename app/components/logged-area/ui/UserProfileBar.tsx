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
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
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
    const [showResults, setShowResults] = useState(false);
    
    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 3) return;
        
        setIsSearching(true);
        setSearchResults([]);
        setShowResults(true);
        
        try {
            // Using the approach from the working component
            const usersRef = collection(db, 'account_info');
            const trimmedSearchTerm = searchTerm.toLowerCase().trim();
            const results: SearchResult[] = [];
            
            try {
                // Try searching by email if it looks like an email
                if (searchTerm.includes('@')) {
                    const emailQuery = query(
                        usersRef, 
                        where('email', '==', trimmedSearchTerm),
                        limit(10)
                    );
                    const emailResults = await getDocs(emailQuery);
                    
                    emailResults.forEach(doc => {
                        if (doc.id !== userData?.uid) {
                            const user = doc.data();
                            results.push({
                                uid: doc.id,
                                username: user.username || '',
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                photoURL: user.photoURL || '',
                                email: user.email || ''
                            });
                        }
                    });
                } else {
                    // Try username searches with multiple variations
                    const usernameVariations = [
                        trimmedSearchTerm,                // lowercase and trimmed
                        searchTerm.trim(),                // original case but trimmed
                        searchTerm.trim().toLowerCase(),  // explicit lowercase and trimmed
                        searchTerm.trim().toUpperCase(),  // uppercase variation
                        searchTerm.trim()[0].toUpperCase() + searchTerm.trim().slice(1).toLowerCase() // Capitalized
                    ];
                    
                    // Try each username variation
                    for (const variation of usernameVariations) {
                        if (results.length > 0) break; // Stop once we find results
                        
                        const usernameQuery = query(
                            usersRef, 
                            where('username', '==', variation),
                            limit(10)
                        );
                        
                        const usernameResults = await getDocs(usernameQuery);
                        
                        usernameResults.forEach(doc => {
                            if (doc.id !== userData?.uid) {
                                const user = doc.data();
                                
                                // Check if this user is already in results
                                if (!results.some(r => r.uid === doc.id)) {
                                    results.push({
                                        uid: doc.id,
                                        username: user.username || '',
                                        firstName: user.firstName || '',
                                        lastName: user.lastName || '',
                                        photoURL: user.photoURL || '',
                                        email: user.email || ''
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error in search queries:', error);
            }
            
            // Set results and update UI state
            setSearchResults(results);
            setIsSearching(false);
            
            // Show message if no results
            if (results.length === 0) {
                toast({
                    variant: "destructive", 
                    title: "Nenhum resultado",
                    description: "Tente inserir um nome de usuário exato ou email"
                });
            }
            
        } catch (error) {
            console.error('Search error:', error);
            toast({
                variant: "destructive",
                title: "Erro na busca",
                description: "Erro ao buscar usuários. Tente novamente."
            });
            setIsSearching(false);
        }
    };
    
    const sendFriendRequest = async (receiver: SearchResult) => {
        if (!userData.uid) {
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: "Você precisa estar logado para enviar solicitações"
            });
            return;
        }
        
        setIsSending(prev => ({ ...prev, [receiver.uid]: true }));
        
        try {
            // Create a new request document in the 'friendship_requests' collection
            const requestData = {
                senderId: userData.uid,
                receiverId: receiver.uid,
                status: 'pending',
                relationshipType: selectedRelationship,
                createdAt: serverTimestamp(),
                senderUsername: userData.username,
                senderPhotoURL: userData.photoURL,
                receiverUsername: receiver.username,
                receiverPhotoURL: receiver.photoURL
            };
            
            // Add the request to Firestore - make sure to use the correct collection name
            await addDoc(collection(db, "friend_requests"), requestData);
            
            toast({
                title: "Solicitação enviada",
                description: "Solicitação de amizade enviada com sucesso"
            });
            
            // Update UI
            setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
            setSearchResults(prev => prev.filter(user => user.uid !== receiver.uid));
            
            if (searchResults.length <= 1) {
                // Reset search term and close search
                setSearchTerm('');
                setSearchResults([]);
                setShowResults(false);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: "Não foi possível enviar a solicitação"
            });
            setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
        }
    };
    
    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
    };
    
    return (
        <div className="flex flex-1 max-w-md relative">
            <div className="flex items-start w-full">
                <div className="flex items-start relative w-full">
                    <Input
                        type="text"
                        placeholder="Buscar usuários por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // Close results if search field is cleared
                            if (!e.target.value) setShowResults(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        className="w-full border-2 h-9 sm:pr-10"
                    />
                    {searchTerm && (
                        <Button 
                            variant="ghost"
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
            
            {/* Search Results Section */}
            {showResults && (
                <div 
                    className="absolute top-full left-0 right-0 mt-1 z-[999] bg-white border-2 border-black rounded-md max-h-[400px] overflow-auto"
                    style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                >
                    {/* Relationship Selection */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-xs font-medium mb-2">Tipo de relação:</p>
                        <div className="flex flex-wrap gap-2">
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
                    </div>
                    
                    {/* Results List */}
                    {searchResults.length > 0 ? (
                        <div className="p-1">
                            {searchResults.map((result) => (
                                <div 
                                    key={result.uid} 
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md m-1 border border-gray-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-gray-300">
                                            {result.photoURL ? (
                                                <AvatarImage src={result.photoURL} alt={result.username} />
                                            ) : (
                                                <AvatarFallback className="bg-gray-100">
                                                    {result.username && result.username[0] ? result.username[0].toUpperCase() : '?'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{result.username || 'Usuário'}</p>
                                            {result.firstName && result.lastName ? (
                                                <p className="text-xs text-gray-500">
                                                    {result.firstName} {result.lastName}
                                                </p>
                                            ) : result.email ? (
                                                <p className="text-xs text-gray-500">{result.email}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => sendFriendRequest(result)}
                                        disabled={isSending[result.uid]}
                                    >
                                        {isSending[result.uid] ? (
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <UserPlus className="h-4 w-4" />
                                        )}
                                        <span>Adicionar</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : isSearching ? (
                        <div className="p-8 text-center">
                            <span className="animate-spin inline-block h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full mb-2" />
                            <p className="text-gray-500">Buscando usuários...</p>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">Nenhum usuário encontrado</p>
                            <p className="text-sm text-gray-400 mt-1">Tente buscar pelo nome de usuário exato ou email</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Main UserNavbar component
 */
const UserNavbar = ({ pathname, onBackClick, userData }: UserNavbarProps) => {
    // Use pathname for navigation if needed
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