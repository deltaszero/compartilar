// types/signup.types.ts

/**
 * Interface representing the signup form data structure
 * @property {string} email - Must be a valid email format
 * @property {string} password - Minimum 8 characters, must include numbers and special characters
 * @property {string} username - Alphanumeric, 3-20 characters
 * @property {string} phoneNumber - Valid phone number format
 * @property {string} birthDate - ISO date string format
 */

import { Timestamp } from 'firebase/firestore';


export enum SignupStep {
    BASIC_INFO = 'basic-info',          // Current: Email, password, username
    PROFILE_PICTURE = 'profile-picture', // Current: Profile photo
    ACCOUNT_INFO = 'account-info',      // Current: Personal details
    KIDS_INFO = 'kids-info',            // New: Add children information
    VERIFICATION = 'verification'
}


export interface KidInfo {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other' | null;
    relationship: 'biological' | 'adopted' | 'guardian' | null;
    photoURL?: string;
    schoolName?: string;
    medicalInfo?: {
        allergies?: string[];
        medications?: string[];
        conditions?: string[];
        bloodType?: string;
        emergencyContact?: {
            name: string;
            phone: string;
            relationship: string;
        }[];
    };
    interests?: string[];
    parentalPlans?: string[]; // Array of parental plan IDs
    parentId: string; // ID of the parent
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface SignupFormData {
    // Basic Info
    email: string;
    password: string;
    confirmPassword: string;
    username: string;
    uid: string;
    // Profile Picture
    photoURL: string;
    // Account Info
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: string;
    // New kids field
    kids: Record<string, KidInfo>;
}
