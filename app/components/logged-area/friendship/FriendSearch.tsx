// app/components/friendship/FriendSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, query, where, getDocs, addDoc, Timestamp, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@/context/userContext';
import { FriendshipRequest, RelationshipType } from '@/types/friendship.types';
import { toast } from 'react-hot-toast';
import { KidInfo } from '@/types/signup.types';

interface SearchResult {
    uid: string;
    username: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

export default function FriendSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState<{[key: string]: boolean}>({});
    const { userData } = useUser();
    const [children, setChildren] = useState<KidInfo[]>([]);
    const [selectedRelationshipType, setSelectedRelationshipType] = useState<RelationshipType>('support');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [showChildSelect, setShowChildSelect] = useState(false);

    // Load user's children
    useEffect(() => {
        const loadChildren = async () => {
            if (!userData?.uid) return;
            
            try {
                const childrenRef = collection(db, 'children');
                const q = query(childrenRef, where('parentId', '==', userData.uid));
                const snapshot = await getDocs(q);
                
                const childrenData: KidInfo[] = [];
                snapshot.forEach(doc => {
                    childrenData.push({
                        id: doc.id,
                        ...doc.data() as KidInfo
                    });
                });
                
                setChildren(childrenData);
            } catch (error) {
                console.error('Error loading children:', error);
            }
        };
        
        loadChildren();
    }, [userData]);

    // Watch for relationship type changes to control child selection visibility
    useEffect(() => {
        setShowChildSelect(selectedRelationshipType === 'coparent');
        
        // Reset selected children if not a coparent
        if (selectedRelationshipType !== 'coparent') {
            setSelectedChildren([]);
        }
    }, [selectedRelationshipType]);

    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 3) return;
        
        setIsLoading(true);
        setSearchResults([]);
        
        try {
            const usersRef = collection(db, 'account_info');
            let searchQuery;
            
            // Determine if input is an email
            if (searchTerm.includes('@')) {
                searchQuery = query(
                    usersRef, 
                    where('email', '==', searchTerm.toLowerCase().trim()),
                    limit(10)
                );
            } else {
                searchQuery = query(
                    usersRef, 
                    where('username', '==', searchTerm.toLowerCase().trim()),
                    limit(10)
                );
            }
            
            const querySnapshot = await getDocs(searchQuery);
            const results: SearchResult[] = [];
            
            querySnapshot.forEach(doc => {
                if (doc.id !== userData?.uid) {
                    results.push({ uid: doc.id, ...doc.data() } as SearchResult);
                }
            });

            if (querySnapshot.empty) {
                toast.error('No user found with that email or username');
                setSearchResults([]);
                return;
            }

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleChildSelection = (childId: string) => {
        setSelectedChildren(prev => {
            if (prev.includes(childId)) {
                return prev.filter(id => id !== childId);
            } else {
                return [...prev, childId];
            }
        });
    };

    const sendFriendRequest = async (receiver: SearchResult) => {
        if (!userData) {
            toast.error('You must be logged in to send friend requests');
            return;
        }
        
        if (receiver.uid === userData.uid) {
            toast.error('You cannot send a friend request to yourself');
            return;
        }
        
        // For coparent relationship type, check if children are selected
        if (selectedRelationshipType === 'coparent' && selectedChildren.length === 0) {
            toast.error('Please select at least one child for co-parenting');
            return;
        }
        
        setIsSending(prev => ({ ...prev, [receiver.uid]: true }));
        
        try {
            // Check if they're already friends
            const friendsRef = doc(db, 'friends', userData.uid, 'friendsList', receiver.uid);
            const friendDoc = await getDoc(friendsRef);
            
            if (friendDoc.exists()) {
                toast.error('You are already friends with this user');
                return;
            }
            
            // Check if there's already a pending request
            const requestsRef = collection(db, 'friendship_requests');
            const existingRequestQuery = query(
                requestsRef, 
                where('senderId', '==', userData.uid),
                where('receiverId', '==', receiver.uid),
                where('status', '==', 'pending')
            );
            
            const existingRequests = await getDocs(existingRequestQuery);
            
            if (!existingRequests.empty) {
                toast.error('Friend request already sent');
                return;
            }
    
            // Create the friendship request
            const timestamp = Timestamp.now();
            const newRequest: Omit<FriendshipRequest, 'id'> = {
                senderId: userData.uid,
                senderUsername: userData.username,
                senderPhotoURL: userData.photoURL,
                senderFirstName: userData.firstName,
                senderLastName: userData.lastName,
                //
                receiverId: receiver.uid,
                receiverUsername: receiver.username,
                receiverPhotoURL: receiver.photoURL,
                receiverFirstName: receiver.firstName,
                receiverLastName: receiver.lastName,
                //
                status: 'pending',
                relationshipType: selectedRelationshipType,
                sharedChildren: selectedRelationshipType === 'coparent' ? selectedChildren : undefined,
                createdAt: timestamp,
                updatedAt: timestamp
            };
    
            await addDoc(collection(db, 'friendship_requests'), newRequest);
            
            // Display appropriate success message based on relationship type
            if (selectedRelationshipType === 'coparent') {
                toast.success('Co-parent request sent successfully!');
            } else {
                toast.success('Friend request sent successfully!');
            }
            
            // Reset relationship type after sending
            setSelectedRelationshipType('support');
            setSelectedChildren([]);
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request. Please try again.');
        } finally {
            setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
        }
    };

    return (
        <section className="container mx-auto py-4">
            {/* User Search */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-medium">Buscar Pessoa</span>
                </label>
                <div className="input-group flex flex-row items-center gap-2">
                    <input
                        type="text"
                        placeholder="Insira um username ou email..."
                        className="input input-bordered w-full shadow-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        className={`btn btn-square btn-primary shadow-xl ${isLoading ? 'loading' : ''}`}
                        onClick={handleSearch}
                        disabled={isLoading || searchTerm.length < 3}
                    >
                        {!isLoading && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="my-4"></div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="flex flex-col gap-3">
                    {/* Relationship Type Selector - Only shown after search results */}
                    <div className="form-control mb-4 bg-base-100 p-3 rounded-lg shadow-sm">
                        <label className="label">
                            <span className="label-text font-medium">Tipo de Relacionamento</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <div className="form-control">
                                <label className="label cursor-pointer gap-2">
                                    <input 
                                        type="radio" 
                                        name="relationshipType" 
                                        className="radio radio-primary" 
                                        checked={selectedRelationshipType === 'support'}
                                        onChange={() => setSelectedRelationshipType('support')}
                                    />
                                    <span className="label-text">Rede de Apoio</span>
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="label cursor-pointer gap-2">
                                    <input 
                                        type="radio" 
                                        name="relationshipType" 
                                        className="radio radio-primary" 
                                        checked={selectedRelationshipType === 'coparent'}
                                        onChange={() => setSelectedRelationshipType('coparent')}
                                    />
                                    <span className="label-text">Co-Parental</span>
                                </label>
                            </div>
                            <div className="form-control">
                                <label className="label cursor-pointer gap-2">
                                    <input 
                                        type="radio" 
                                        name="relationshipType" 
                                        className="radio radio-primary" 
                                        checked={selectedRelationshipType === 'other'}
                                        onChange={() => setSelectedRelationshipType('other')}
                                    />
                                    <span className="label-text">Outro</span>
                                </label>
                            </div>
                        </div>
                        
                        {/* Child Selection (only shown for coparent type) */}
                        {showChildSelect && (
                            <div className="form-control mt-4">
                                <label className="label">
                                    <span className="label-text font-medium">Selecione as crianças compartilhadas</span>
                                </label>
                                {children.length === 0 ? (
                                    <div className="alert alert-info">
                                        <p>Você não tem crianças cadastradas. Adicione crianças primeiro.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                        {children.map(child => (
                                            <label key={child.id} className="flex items-center p-2 border rounded-lg hover:bg-base-200 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary mr-3"
                                                    checked={selectedChildren.includes(child.id)}
                                                    onChange={() => toggleChildSelection(child.id)}
                                                />
                                                <span>
                                                    {child.firstName} {child.lastName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* User Search Results */}
                    {searchResults.map((result) => (
                        <div key={result.uid} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                {result.photoURL ? (
                                    <Image src={result.photoURL} alt={result.username} width={40} height={40} className="rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-primary-content text-lg">
                                            {result.username[0].toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium">{result.username}</h3>
                                    {result.firstName && result.lastName && (
                                        <p className="text-sm opacity-70">
                                            {result.firstName} {result.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                className={`btn ${selectedRelationshipType === 'coparent' ? 'btn-secondary' : 'btn-primary'} btn-sm ${isSending[result.uid] ? 'loading' : ''}`}
                                onClick={() => sendFriendRequest(result)}
                                disabled={isSending[result.uid] || (selectedRelationshipType === 'coparent' && selectedChildren.length === 0)}
                                title={selectedRelationshipType === 'coparent' && selectedChildren.length === 0 ? 'Selecione pelo menos uma criança' : ''}
                            >
                                {isSending[result.uid] 
                                    ? 'Enviando...' 
                                    : selectedRelationshipType === 'coparent' 
                                        ? 'Add Co-Parent' 
                                        : 'Adicionar'
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {searchTerm && !isLoading && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    Nenhum nome de usuário similar a &quot;{searchTerm}&quot; encontrado 😕
                </div>
            )}
        </section>
    );
}