// app/components/friendship/FriendRequests.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
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
    
    // Define loadFriendRequests with useCallback to memoize it
    const loadFriendRequests = useCallback(async () => {
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
    }, [userData]);

    // Add useEffect to load friend requests when userData changes
    useEffect(() => {
        if (userData) {
            loadFriendRequests();
        }
    }, [userData, loadFriendRequests]);

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
    
                // Add to current user's friends with relationship type and shared children (if applicable)
                await setDoc(doc(db, 'friends', userData.uid, 'friendsList', request.senderId), {
                    username: request.senderUsername,
                    photoURL: request.senderPhotoURL,
                    addedAt: timestamp,
                    firstName: request.senderFirstName,
                    lastName: request.senderLastName,
                    relationshipType: request.relationshipType || 'support',
                    ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
                });
    
                // Add to sender's friends with relationship type and shared children (if applicable)
                await setDoc(doc(db, 'friends', request.senderId, 'friendsList', userData.uid), {
                    username: userData.username,
                    photoURL: userData.photoURL,
                    addedAt: timestamp,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    relationshipType: request.relationshipType || 'support',
                    ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
                });
                
                // If this is a coparent relationship with shared children, 
                // create co-parenting relationship record
                if (request.relationshipType === 'coparent' && request.sharedChildren && request.sharedChildren.length > 0) {
                    const coParentingId = `${userData.uid}_${request.senderId}`;
                    await setDoc(doc(db, 'co_parenting_relationships', coParentingId), {
                        parent1Id: userData.uid,
                        parent2Id: request.senderId,
                        sharedChildren: request.sharedChildren,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        status: 'active'
                    });
                    
                    // Success message specific to co-parenting
                    toast.success('Co-parenting relationship established');
                }
            }
    
            // Remove the request from the list
            setRequests(prev => prev.filter(req => req.id !== requestId));
            
            // Show appropriate success message based on relationship type
            const request = requests.find(req => req.id === requestId);
            if (status === 'accepted' && request?.relationshipType === 'coparent') {
                toast.success('Co-parent added successfully');
            } else {
                toast.success(`Friend request ${status}`);
            }
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
            <h2 className="text-lg font-semibold mb-2">Solicitações Pendentes</h2>
            {requests.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                    Sem pedidos de amizade pendentes
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="flex flex-col sm:flex-row w-full items-center justify-between bg-base-200 rounded-lg p-4 gap-4">
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
                                    {request.senderFirstName && request.senderLastName && (
                                        <p className="text-sm text-gray-600">
                                            {request.senderFirstName} {request.senderLastName}
                                        </p>
                                    )}
                                    
                                    {/* Relationship Type Badge */}
                                    <div className="mt-1">
                                        {request.relationshipType === 'coparent' && (
                                            <span className="badge badge-secondary">Co-Parental</span>
                                        )}
                                        {request.relationshipType === 'support' && (
                                            <span className="badge badge-primary">Rede de Apoio</span>
                                        )}
                                        {request.relationshipType === 'other' && (
                                            <span className="badge badge-neutral">Outro</span>
                                        )}
                                    </div>
                                    
                                    {/* Shared Children (if co-parent) */}
                                    {request.relationshipType === 'coparent' && request.sharedChildren && request.sharedChildren.length > 0 && (
                                        <div className="mt-2 text-xs">
                                            <span>Crianças compartilhadas: {request.sharedChildren.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2">
                                <button
                                    className={`btn ${request.relationshipType === 'coparent' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
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