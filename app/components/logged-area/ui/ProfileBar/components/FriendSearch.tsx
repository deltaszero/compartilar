'use client';

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X } from "lucide-react";
import { auth } from '@/app/lib/firebaseConfig';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SearchResult } from '../types';
import { useWindowSize } from '@/hooks/useWindowSize';

interface FriendSearchProps {
    userData: { 
        username: string; 
        photoURL?: string; 
        uid?: string;
        firstName?: string;
        lastName?: string;
    };
}

/**
 * FriendSearch component - Refactored to use the updated database schema
 */
export const FriendSearch = ({ userData }: FriendSearchProps) => {
    const { toast } = useToast();
    const { width } = useWindowSize();
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
            console.log("Loading users for search:", searchTerm);
            
            // Get the current user's auth token
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to search');
            }
            
            // Get a fresh ID token
            const idToken = await user.getIdToken(true);
            
            // Use the API endpoint to search for users
            const response = await fetch(
                `/api/users/search?term=${encodeURIComponent(searchTerm)}&userId=${userData?.uid}&limit=10`,
                {
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error searching for users');
            }
            
            const results = await response.json();
            console.log("Search results:", results);
            
            // Set results and update UI state
            setSearchResults(results);
            setIsSearching(false);
            
            // Show message if no results
            if (results.length === 0) {
                toast({
                    variant: "destructive", 
                    title: "Nenhum resultado",
                    description: "Tente outro termo de busca"
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            toast({
                variant: "destructive",
                title: "Erro na busca",
                description: error instanceof Error ? error.message : "Erro ao buscar usuários. Tente novamente."
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
            console.log('Sending friend request to:', receiver.uid, 'from:', userData.uid);
            
            // Get the current user's auth token
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to send friend requests');
            }
            
            // Get a fresh ID token
            const idToken = await user.getIdToken(true);
            
            // Use the API endpoint to send a friend request
            const response = await fetch('/api/friends/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    senderId: userData.uid,
                    receiverId: receiver.uid,
                    relationshipType: selectedRelationship,
                    senderUsername: userData.username || '',
                    senderPhotoURL: userData.photoURL || '',
                    receiverUsername: receiver.username || ''
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send friend request');
            }
            
            console.log('Friend request API response:', data);
            
            // Handle different responses from the API
            if (data.message === 'Friend request already sent') {
                toast({
                    variant: "default",
                    title: "Solicitação já enviada",
                    description: "Você já enviou uma solicitação para este usuário"
                });
            } else if (data.message === 'Users are already friends') {
                toast({
                    variant: "default",
                    title: "Já são amigos",
                    description: "Você e este usuário já são amigos"
                });
            } else if (data.message === 'There is already an incoming request from this user') {
                toast({
                    variant: "default",
                    title: "Solicitação pendente",
                    description: "Esta pessoa já enviou uma solicitação para você. Verifique suas notificações."
                });
            } else {
                // Request was successfully sent
                toast({
                    title: "Solicitação enviada",
                    description: "Solicitação de amizade enviada com sucesso"
                });
            }
            
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
                description: error instanceof Error ? `Erro: ${error.message}` : "Não foi possível enviar a solicitação"
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
                        placeholder="Buscar usuários..."
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
                    // disabled={isSearching || searchTerm.length < 3}
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
                    className="absolute top-full mt-2 z-[999] w-screen md:w-full max-w-screen-sm bg-white border-2 border-black rounded-md overflow-auto"
                    style={{ 
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        left: '50%',
                        transform: width && width < 768 ? 'translateX(-45%)' : 'translateX(-50%)',
                        maxWidth: 'calc(100vw - 2rem)'
                    }}
                >
                    {/* Relationship Selection */}
                    {/* <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-xs font-medium mb-2">Tipo de relação:</p>
                        <div className="flex flex-wrap gap-2">
                            <Badge 
                                variant={selectedRelationship === 'support' ? 'default' : 'default'}
                                className="cursor-pointer"
                                onClick={() => setSelectedRelationship('support')}
                            >
                                Rede de Apoio
                            </Badge>
                            <Badge 
                                variant={selectedRelationship === 'coparent' ? 'default' : 'default'}
                                className="cursor-pointer"
                                onClick={() => setSelectedRelationship('coparent')}
                            >
                                Co-Parental
                            </Badge>
                            <Badge 
                                variant={selectedRelationship === 'other' ? 'default' : 'default'}
                                className="cursor-pointer"
                                onClick={() => setSelectedRelationship('other')}
                            >
                                Outro
                            </Badge>
                        </div>
                    </div> */}
                    
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
                                                <AvatarImage src={result.photoURL} alt={result.displayName || result.username} />
                                            ) : (
                                                <AvatarFallback className="bg-gray-100">
                                                    {result.displayName?.[0] || result.username?.[0] || '?'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{result.displayName || result.username || 'Usuário'}</p>
                                            {result.username && (
                                                <p className="text-xs text-gray-500">
                                                    @{result.username}
                                                </p>
                                            )}
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
                            <p className="text-sm text-gray-400 mt-1">Tente buscar pelo nome de usuário ou nome completo</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};