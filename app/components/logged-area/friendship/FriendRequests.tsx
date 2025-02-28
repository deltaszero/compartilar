// app/components/friendship/FriendRequests.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@/context/userContext';
import { FriendshipRequest } from '@/types/friendship.types';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function FriendRequests() {
    const [requests, setRequests] = useState<FriendshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userData } = useUser();

    useEffect(() => {
        if (userData) {
            loadFriendRequests();
        }
    }, [userData]);

    const loadFriendRequests = async () => {
        if (!userData) return;

        try {
            const requestsRef = collection(db, 'friendship_requests');
            const q = query(
                requestsRef,
                where('receiverId', '==', userData.uid),
                where('status', '==', 'pending')
            );

            const querySnapshot = await getDocs(q);
            const requestsList: FriendshipRequest[] = [];
            querySnapshot.forEach((doc) => {
                requestsList.push({ id: doc.id, ...doc.data() } as FriendshipRequest);
            });

            setRequests(requestsList);
        } catch (error) {
            console.error('Error loading friend requests:', error);
            toast.error('Failed to load friend requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
        try {
            const requestRef = doc(db, 'friendship_requests', requestId);
            const timestamp = Timestamp.now();
    
            await updateDoc(requestRef, {
                status,
                updatedAt: timestamp
            });
    
            if (status === 'accepted' && userData) {
                const request = requests.find(req => req.id === requestId);
                if (!request) return;
    
                // Add to current user's friends
                await setDoc(doc(db, 'friends', userData.uid, 'friendsList', request.senderId), {
                    username: request.senderUsername,
                    photoURL: request.senderPhotoURL,
                    addedAt: timestamp,
                    firstName: request.senderFirstName,
                    lastName: request.senderLastName
                });
    
                // Add to sender's friends
                await setDoc(doc(db, 'friends', request.senderId, 'friendsList', userData.uid), {
                    username: userData.username,
                    photoURL: userData.photoURL,
                    addedAt: timestamp,
                    firstName: userData.firstName,
                    lastName: userData.lastName
                });
            }
    
            // Remove the request from the list
            setRequests(prev => prev.filter(req => req.id !== requestId));
            toast.success(`Friend request ${status}`);
        } catch (error) {
            console.error(`Error ${status} friend request:`, error);
            toast.error(`Failed to ${status} friend request`);
        }
    };

    if (isLoading) {
        return <div className="text-center py-4">Loading requests...</div>;
    }

    return (
        <section className="container mx-auto">
            {requests.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                    Sem pedidos de amizade pendentes
                </div>
            ) : (
                <div>
                    {requests.map((request) => (
                        <div key={request.id} className="flex flex-row w-full items-center justify-between bg-base-300 rounded-lg p-2">
                            <div className="flex items-center gap-4">
                                {request.senderPhotoURL ? (
                                    <Image src={request.senderPhotoURL} alt={request.senderUsername} width={64} height={64} className="rounded-full" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-primary-content text-lg">
                                            {request.senderUsername[0].toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium">{request.senderUsername}</h3>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleRequest(request.id, 'accepted')}
                                >
                                    Aceitar
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleRequest(request.id, 'declined')}
                                >
                                    Rejeitar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}