// types/user.types.ts
import { Timestamp } from 'firebase/firestore';
import { AccessLevel } from './signup.types';

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    photoURL?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: string;
    gender?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    premiumStatus?: 'free' | 'premium';
    premiumValidUntil?: Timestamp;
}

// Updated children-related types with permission model
export interface Child {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender?: string;
    photoURL?: string;
    schoolName?: string;
    
    // Permission arrays
    viewers: string[]; // User IDs with view-only access
    editors: string[]; // User IDs with edit access
    
    // Child-specific data
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
    
    // Metadata
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy?: string;
    
    // Frontend-only property (not stored in database)
    accessLevel?: AccessLevel;
}

// Expense group-related types
export interface ExpenseGroup {
    id: string;
    childId: string;
    name: string;
    description?: string;
    category?: string;
    isShared: boolean;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy?: string;
}

// Expense-related types
export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    currency: string;
    date: Timestamp;
    category: string;
    paidBy: string;
    receipt?: {
        url: string;
        uploadedAt: Timestamp;
    };
    status: 'pending' | 'settled' | 'disputed';
    splitRatio?: {
        [userId: string]: number; // Percentage of expense
    };
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy?: string;
}

// Legacy relationship types - kept for backward compatibility

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

// Guardian relationship type - will be deprecated
export type GuardianRelationshipType = 
    'mother' | 
    'father' | 
    'stepmother' | 
    'stepfather' | 
    'grandmother' | 
    'grandfather' | 
    'aunt' | 
    'uncle' | 
    'sibling' | 
    'caregiver' | 
    'legal_guardian' | 
    'other';

// Child guardian relationship - will be deprecated in favor of the viewers/editors arrays
export interface ChildGuardianRelationship {
    id: string;
    childId: string;
    guardianId: string;
    relationshipType: GuardianRelationshipType;
    isPrimaryGuardian: boolean;
    permissions: {
        canEdit: boolean;
        canViewMedical: boolean;
        canViewEducation: boolean;
        canSchedule: boolean;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}