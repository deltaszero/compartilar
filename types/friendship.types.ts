// types/friendship.types.ts
import { Timestamp } from 'firebase/firestore';

export interface FriendshipRequest {
    id: string;
    senderId: string;
    senderUsername: string;
    senderPhotoURL?: string;
    senderFirstName?: string;
    senderLastName?: string;
    receiverId: string;
    receiverUsername: string;
    receiverPhotoURL?: string;
    receiverFirstName?: string;
    receiverLastName?: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Friend {
    id: string;
    username: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
}

export interface FriendListItem {
    id: string;
    username: string;
    photoURL?: string;
    addedAt: Timestamp;  // Changed from Date to Timestamp
    firstName?: string;
    lastName?: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type FriendshipRequestCreate = Omit<FriendshipRequest, 'id'>;