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

    // Group friends by relationship type
    const supportFriends = friends.filter(friend => friend.relationshipType === 'support');
    const coparentFriends = friends.filter(friend => friend.relationshipType === 'coparent');
    const otherFriends = friends.filter(friend => friend.relationshipType === 'other' || !friend.relationshipType);

    const renderFriendItem = (friend: FriendListItem) => (
        <Link
            href={`/${friend.username}/perfil`}
            key={friend.username}
            className="block transition-all hover:scale-[1.02]"
        >
            <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-base-200 rounded-lg hover:bg-base-300">
                {friend.photoURL ? (
                    <div className="avatar">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full">
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
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral text-neutral-content">
                            <span className="text-sm sm:text-xl">
                                {friend.username[0].toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                            {friend.firstName} {friend.lastName}
                        </h3>
                        {friend.relationshipType && (
                            <span className={`badge badge-sm ${
                                friend.relationshipType === 'coparent' ? 'badge-secondary' :
                                friend.relationshipType === 'support' ? 'badge-primary' : 'badge-neutral'
                            }`}>
                                {friend.relationshipType === 'coparent' ? 'Co-Parent' :
                                 friend.relationshipType === 'support' ? 'Apoio' : 'Outro'}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-base-content/70">
                        Adicionado em {friend.addedAt.toDate().toLocaleDateString()}
                    </span>
                    
                    {/* Display shared children for coparents */}
                    {friend.relationshipType === 'coparent' && friend.sharedChildren && friend.sharedChildren.length > 0 && (
                        <div className="mt-1">
                            <span className="text-xs text-base-content/70">
                                {friend.sharedChildren.length} {friend.sharedChildren.length === 1 ? 'criança compartilhada' : 'crianças compartilhadas'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );

    return (
        <div className="w-full max-w-xl mx-auto">
            {friends.length === 0 ? (
                <div className="text-center py-6 flex flex-col items-center gap-2 text-gray-500">
                    <span className="text-4xl">👥</span>
                    <p>Você ainda não tem amigos adicionados</p>
                </div>
            ) : (
                <>
                    {coparentFriends.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                                <span className="mr-2 text-secondary">👨‍👩‍👧‍👦</span>
                                Co-Pais
                            </h2>
                            <div className="grid gap-2">
                                {coparentFriends.map(renderFriendItem)}
                            </div>
                        </div>
                    )}
                    
                    {supportFriends.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                                <span className="mr-2 text-primary">💜</span>
                                Rede de Apoio
                            </h2>
                            <div className="grid gap-2">
                                {supportFriends.map(renderFriendItem)}
                            </div>
                        </div>
                    )}
                    
                    {otherFriends.length > 0 && (
                        <div className="mb-4">
                            <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                                <span className="mr-2">👤</span>
                                Outros Contatos
                            </h2>
                            <div className="grid gap-2">
                                {otherFriends.map(renderFriendItem)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FriendList;