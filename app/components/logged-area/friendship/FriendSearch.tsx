// app/components/friendship/FriendSearch.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { collection, query, where, getDocs, addDoc, Timestamp, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@/context/userContext';
import { FriendshipRequest } from '@/types/friendship.types';
import { toast } from 'react-hot-toast';

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

    const sendFriendRequest = async (receiver: SearchResult) => {
        if (!userData) {
            toast.error('You must be logged in to send friend requests');
            return;
        }
        
        if (receiver.uid === userData.uid) {
            toast.error('You cannot send a friend request to yourself');
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
                createdAt: timestamp,
                updatedAt: timestamp
            };
    
            await addDoc(collection(db, 'friendship_requests'), newRequest);
            toast.success('Friend request sent successfully!');
            
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request. Please try again.');
        } finally {
            setIsSending(prev => ({ ...prev, [receiver.uid]: false }));
        }
    };

    return (
        <section className="container mx-auto py-4">
            <div className="form-control">
                <div className="input-group flex flex-row items-center gap-2">
                    <input
                        type="text"
                        placeholder="Insira um username..."
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
            {searchResults.length > 0 && (
                <div className="flex flex-col gap-3">
                    {searchResults.map((result) => (
                        <div key={result.uid} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                {result.photoURL ? (
                                    // <img src={result.photoURL} alt={result.username} className="w-10 h-10 rounded-full" />
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
                                className={`btn btn-primary btn-sm ${isSending[result.uid] ? 'loading' : ''}`}
                                onClick={() => sendFriendRequest(result)}
                                disabled={isSending[result.uid]}
                            >
                                {isSending[result.uid] ? 'Enviando...' : 'Adicionar'}
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