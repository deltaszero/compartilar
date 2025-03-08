'use client';

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X } from "lucide-react";
import { collection, getDocs, query, where, limit as queryLimit, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
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
            const searchTermLower = searchTerm.toLowerCase().trim();
            const usersRef = collection(db, 'users');
            const results: SearchResult[] = [];
            const processedUids = new Set<string>(); // Track unique users
            
            // Search by username
            const usernameQuery = query(
                usersRef, 
                where('username', '>=', searchTermLower),
                where('username', '<=', searchTermLower + '\uf8ff'),
                queryLimit(20)
            );
            
            // Search by displayName
            const displayNameQuery = query(
                usersRef, 
                where('displayName', '>=', searchTermLower),
                where('displayName', '<=', searchTermLower + '\uf8ff'),
                queryLimit(20)
            );
            
            // Search by email
            const emailQuery = query(
                usersRef, 
                where('email', '>=', searchTermLower),
                where('email', '<=', searchTermLower + '\uf8ff'),
                queryLimit(20)
            );
            
            // Execute all queries in parallel
            const [usernameSnapshot, displayNameSnapshot, emailSnapshot] = await Promise.all([
                getDocs(usernameQuery),
                getDocs(displayNameQuery),
                getDocs(emailQuery)
            ]);
            
            // Process all snapshots and combine results
            const processSnapshot = (snapshot: any) => {
                snapshot.forEach((doc: any) => {
                    const user = doc.data();
                    // Skip current user and already processed users
                    if (doc.id !== userData?.uid && !processedUids.has(doc.id)) {
                        processedUids.add(doc.id);
                        results.push({
                            uid: doc.id,
                            username: user.username || '',
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            photoURL: user.photoURL || '',
                            email: user.email || '',
                            displayName: user.displayName || user.username || ''
                        });
                    }
                });
            };
            
            processSnapshot(usernameSnapshot);
            processSnapshot(displayNameSnapshot);
            processSnapshot(emailSnapshot);
            
            // Sort results by relevance
            results.sort((a, b) => {
                const aUsername = a.username.toLowerCase();
                const bUsername = b.username.toLowerCase();
                const aDisplayName = a.displayName.toLowerCase();
                const bDisplayName = b.displayName.toLowerCase();
                
                // Exact username matches first
                if (aUsername === searchTermLower && bUsername !== searchTermLower) return -1;
                if (bUsername === searchTermLower && aUsername !== searchTermLower) return 1;
                
                // Then username starts with search term
                if (aUsername.startsWith(searchTermLower) && !bUsername.startsWith(searchTermLower)) return -1;
                if (bUsername.startsWith(searchTermLower) && !aUsername.startsWith(searchTermLower)) return 1;
                
                // Then displayName matches
                if (aDisplayName.includes(searchTermLower) && !bDisplayName.includes(searchTermLower)) return -1;
                if (bDisplayName.includes(searchTermLower) && !aDisplayName.includes(searchTermLower)) return 1;
                
                // Alphabetical by username as fallback
                return aUsername.localeCompare(bUsername);
            });
            
            // Limit results to first 10
            const limitedResults = results.slice(0, 10);
            
            console.log("Search results:", limitedResults);
            
            // Set results and update UI state
            setSearchResults(limitedResults);
            setIsSearching(false);
            
            // Show message if no results
            if (limitedResults.length === 0) {
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
            console.log('Sending friend request to:', receiver.uid, 'from:', userData.uid);
            
            // Create a friendship request in a subcollection under users instead of a separate collection
            const receiverRequestsRef = collection(db, 'users', receiver.uid, 'friendship_requests');
            
            // First check if there's an existing pending request from this user
            const existingRequestQuery = query(
                receiverRequestsRef,
                where('senderId', '==', userData.uid),
                where('status', '==', 'pending')
            );
            
            const existingRequests = await getDocs(existingRequestQuery);
            
            // If there's already a pending request, don't create a duplicate
            if (!existingRequests.empty) {
                console.log('Pending request already exists, not creating duplicate');
                toast({
                    variant: "default",
                    title: "Solicitação já enviada",
                    description: "Você já enviou uma solicitação para este usuário"
                });
                
                // Update UI
                setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
                setSearchResults(prev => prev.filter(user => user.uid !== receiver.uid));
                return;
            }
            
            // Check if we're already friends
            const userFriendsRef = collection(db, 'users', userData.uid, 'friends');
            const friendDocRef = doc(userFriendsRef, receiver.uid);
            const friendDoc = await getDoc(friendDocRef);
            
            if (friendDoc.exists()) {
                console.log('Already friends, not creating request');
                toast({
                    variant: "default",
                    title: "Já são amigos",
                    description: "Você e este usuário já são amigos"
                });
                
                // Update UI
                setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
                setSearchResults(prev => prev.filter(user => user.uid !== receiver.uid));
                return;
            }
            
            // Also check for incoming friend requests from this user
            const myRequestsRef = collection(db, 'users', userData.uid, 'friendship_requests');
            const incomingRequestQuery = query(
                myRequestsRef,
                where('senderId', '==', receiver.uid),
                where('status', '==', 'pending')
            );
            
            const incomingRequests = await getDocs(incomingRequestQuery);
            
            if (!incomingRequests.empty) {
                console.log('Incoming request found, suggesting to accept it');
                toast({
                    variant: "default",
                    title: "Solicitação pendente",
                    description: "Esta pessoa já enviou uma solicitação para você. Verifique suas notificações."
                });
                
                // Update UI
                setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
                setSearchResults(prev => prev.filter(user => user.uid !== receiver.uid));
                return;
            }
            
            // Create the request data with minimal required fields
            const requestData = {
                senderId: userData.uid,
                receiverId: receiver.uid,
                status: 'pending',
                relationshipType: selectedRelationship,
                createdAt: serverTimestamp(),
                senderUsername: userData.username || '',
                senderPhotoURL: userData.photoURL || '',
                receiverUsername: receiver.username || ''
            };
            
            console.log('Creating request document with data:', requestData);
            
            // Add the request to the receiver's requests subcollection
            const docRef = await addDoc(receiverRequestsRef, requestData);
            console.log('Request document created successfully with ID:', docRef.id);
            
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
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                
                toast({
                    variant: "destructive",
                    title: "Erro ao enviar",
                    description: `Erro: ${error.message}`
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao enviar",
                    description: "Não foi possível enviar a solicitação"
                });
            }
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
                    className="absolute top-full mt-2 z-[999] w-screen md:w-full max-w-screen-sm bg-white border-2 border-black rounded-md overflow-auto"
                    style={{ 
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        left: '50%',
                        transform: width && width < 768 ? 'translateX(-45%)' : 'translateX(-50%)',
                        maxWidth: 'calc(100vw - 2rem)'
                    }}
                >
                    {/* Relationship Selection */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-xs font-medium mb-2">Tipo de relação:</p>
                        <div className="flex flex-wrap gap-2">
                            <Badge 
                                variant={selectedRelationship === 'support' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setSelectedRelationship('support')}
                            >
                                Rede de Apoio
                            </Badge>
                            <Badge 
                                variant={selectedRelationship === 'coparent' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setSelectedRelationship('coparent')}
                            >
                                Co-Parental
                            </Badge>
                            <Badge 
                                variant={selectedRelationship === 'other' ? 'default' : 'outline'}
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