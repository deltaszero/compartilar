// Types for the finance components
import { Timestamp } from "firebase/firestore";

export interface Friend {
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    photoURL?: string;
}

export interface CostGroup {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    members: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ExpenseMember {
    uid: string;
    name: string;
    splitType: 'equal' | 'percentage' | 'fixed';
    splitValue: number;
    photoURL?: string;
}

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    date: Timestamp;
    members: ExpenseMember[];
    childrenIds?: string[];  // IDs of children associated with this expense
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Balance {
    uid: string;
    name: string;
    photoURL?: string;
    balance: number;
}

export interface Child {
    id: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
    birthDate: string;
    accessLevel?: 'viewer' | 'editor';
}

export interface FinanceUserData {
    uid: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
}

export type SplitMethod = 'equal' | 'percentage' | 'fixed';
export type PeriodFilter = '7d' | '30d' | '90d' | 'all';