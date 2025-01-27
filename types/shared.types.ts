// types/shared.types.ts
import { Timestamp } from 'firebase/firestore';

// Calendar-related types
export interface CalendarEvent {
    id: string;
    coParentingId: string;
    childId?: string;
    title: string;
    description?: string;
    startTime: Timestamp;
    endTime: Timestamp;
    location?: {
        address: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    category: 'school' | 'medical' | 'activity' | 'visitation' | 'other';
    responsibleParentId: string;
    checkInRequired: boolean;
    checkInStatus?: 'pending' | 'completed' | 'missed';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Task-related types
export interface SharedTask {
    id: string;
    coParentingId: string;
    childId?: string;
    title: string;
    description?: string;
    dueDate: Timestamp;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
    category: 'school' | 'medical' | 'activity' | 'household' | 'other';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Expense-related types
export interface SharedExpense {
    id: string;
    coParentingId: string;
    childId?: string;
    description: string;
    amount: number;
    currency: string;
    category: 'education' | 'medical' | 'activities' | 'clothing' | 'other';
    paidBy: string;
    splitRatio: {
        [parentId: string]: number; // Percentage of expense
    };
    receipt?: {
        url: string;
        uploadedAt: Timestamp;
    };
    status: 'pending' | 'settled' | 'disputed';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Message-related types
export interface SharedMessage {
    id: string;
    coParentingId: string;
    senderId: string;
    content: string;
    attachments?: {
        type: 'image' | 'document' | 'audio';
        url: string;
        name: string;
    }[];
    readBy: {
        [userId: string]: Timestamp;
    };
    createdAt: Timestamp;
}

// Decision-related types
export interface SharedDecision {
    id: string;
    coParentingId: string;
    childId?: string;
    title: string;
    description: string;
    category: 'education' | 'medical' | 'activities' | 'lifestyle' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'modified';
    responses: {
        [parentId: string]: {
            response: 'approve' | 'reject' | 'modify';
            comment?: string;
            timestamp: Timestamp;
        };
    };
    dueDate?: Timestamp;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}