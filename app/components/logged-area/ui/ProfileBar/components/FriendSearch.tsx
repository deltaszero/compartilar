'use client';

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X } from "lucide-react";
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SearchResult } from '../types';

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
 * FriendSearch component
 */
export const FriendSearch = ({ userData }: FriendSearchProps) => {
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
            console.log("Loading users for search:", searchTerm);
            
            // For now, just get friend requests and convert them to notification format
            const usersRef = collection(db, 'account_info');
            const searchQuery = query(
                usersRef,
                where('username', '==', searchTerm.toLowerCase().trim()),
                limit(10)
            );
            
            const querySnapshot = await getDocs(searchQuery);
            const results: SearchResult[] = [];
            
            querySnapshot.forEach(doc => {
                // Skip current user
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
            
            // If no results from username, try email
            if (results.length === 0 && searchTerm.includes('@')) {
                const emailQuery = query(
                    usersRef, 
                    where('email', '==', searchTerm.toLowerCase().trim()),
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
            }
            
            console.log("Search results:", results);
            
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
                senderFirstName: userData?.firstName || '',
                senderLastName: userData?.lastName || '',
                receiverUsername: receiver.username,
                receiverPhotoURL: receiver.photoURL,
                receiverFirstName: receiver.firstName || '',
                receiverLastName: receiver.lastName || ''
            };
            
            // Add the request to Firestore - using the CORRECT collection name from the working component
            await addDoc(collection(db, "friendship_requests"), requestData);
            
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
                            variant="default"
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