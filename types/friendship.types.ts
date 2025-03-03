// types/friendship.types.ts
import { Timestamp } from 'firebase/firestore';

export type RelationshipType = 'coparent' | 'support' | 'other';

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
    relationshipType: RelationshipType;
    sharedChildren?: string[]; // Array of child IDs (for coparent relationship)
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Friend {
    id: string;
    username: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    relationshipType: RelationshipType;
    sharedChildren?: string[]; // Array of child IDs (for coparent relationship)
}

export interface FriendListItem {
    id: string;
    username: string;
    photoURL?: string;
    addedAt: Timestamp;
    firstName?: string;
    lastName?: string;
    relationshipType: RelationshipType;
    sharedChildren?: string[]; // Array of child IDs (for coparent relationship)
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type FriendshipRequestCreate = Omit<FriendshipRequest, 'id'>;