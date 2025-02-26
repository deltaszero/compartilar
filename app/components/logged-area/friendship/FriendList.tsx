// /home/dusoudeth/Documentos/github/compartilar/app/components/friendship/FriendList.tsx
'use client';

import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import Image from 'next/image';
import Link from 'next/link';
import { FriendListItem } from '@/types/friendship.types';

interface FriendListProps {
    userId: string;
}

const FriendList: React.FC<FriendListProps> = ({ userId }) => {
    const [friends, setFriends] = React.useState<FriendListItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchFriends = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Query the nested friendsList collection
                const friendsRef = collection(db, 'friends', userId, 'friendsList');
                const snapshot = await getDocs(friendsRef);

                const friendsData: FriendListItem[] = [];
                snapshot.forEach((doc) => {
                    friendsData.push({
                        ...doc.data() as FriendListItem,
                        id: doc.id
                    });
                });

                setFriends(friendsData);
            } catch (err) {
                console.error('Error fetching friends:', err);
                setError('Erro ao carregar lista de amigos');
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchFriends();
        }
    }, [userId]);

    if (isLoading) {
        return (
            <div className="w-full max-w-xl mx-auto p-4">
                <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-xl mx-auto p-4">
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto py-2">
            <div className="grid gap-3">
                {friends.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                        Você ainda não tem amigos adicionados
                    </div>
                ) : (
                    friends.map((friend) => (
                        <Link
                            href={`/${friend.username}`}
                            key={friend.username}
                            className="block transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center space-x-3 p-3 bg-base-200 rounded-lg hover:bg-base-300">
                                {friend.photoURL ? (
                                    <div className="avatar">
                                        <div className="w-12 h-12 rounded-full">
                                            <Image
                                                src={friend.photoURL}
                                                alt={friend.username}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="avatar placeholder">
                                        <div className="w-12 h-12 rounded-full bg-neutral text-neutral-content">
                                            <span className="text-xl">
                                                {friend.username[0].toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <h3 className="font-medium">
                                        {friend.firstName}
                                    </h3>
                                    <span className="text-sm text-base-content/70">
                                        Adicionado em {friend.addedAt.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default FriendList;