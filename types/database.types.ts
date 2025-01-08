// types/database.types.ts
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    photoURL?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: string;
    createdAt: Timestamp;
    premiumStatus: 'free' | 'premium';
    premiumValidUntil?: Timestamp;
}

// Children-related types
export interface Child {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender?: string;
    photoURL?: string;
    schoolName?: string;
    medicalInfo?: {
        allergies: string[];
        medications: string[];
        conditions: string[];
        bloodType?: string;
        emergencyContact: {
            name: string;
            phone: string;
            relationship: string;
        }[];
    };
    interests?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Parenting relationship types
export interface ParentingRelationship {
    id: string;
    childId: string;
    parentId: string;
    relationshipType: 'biological' | 'adoptive' | 'legal_guardian';
    custodyType?: 'full' | 'shared' | 'visitation';
    legalDocuments?: {
        type: string;
        url: string;
        uploadedAt: Timestamp;
    }[];
    createdAt: Timestamp;
}

// Co-parenting relationship types
export interface CoParentingRelationship {
    id: string;
    parent1Id: string;
    parent2Id: string;
    status: 'pending' | 'active' | 'suspended' | 'terminated';
    kids: string[]; // Array of childIds
    custodyAgreement?: {
        type: string;
        url: string;
        uploadedAt: Timestamp;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}