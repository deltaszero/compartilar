// types/signup.types.ts

/**
 * Interface representing the signup form data structure
 * @property {string} email - Must be a valid email format
 * @property {string} password - Minimum 8 characters, must include numbers and special characters
 * @property {string} username - Alphanumeric, 3-20 characters
 * @property {string} phoneNumber - Valid phone number format
 * @property {string} birthDate - ISO date string format
 */

export type SignupStep = 
    | 'basic-info'          // Current: Email, password, username
    | 'profile-picture'     // Current: Profile photo
    | 'account-info'        // Current: Personal details
    | 'kids-info'           // New: Add children information
    | 'verification';

export interface KidInfo {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender?: 'male' | 'female' | 'other';
    relationship?: 'biological' | 'adopted' | 'guardian';
}

export interface SignupFormData {
    // Basic Info
    email: string;
    password: string;
    confirmPassword: string;
    username: string;

    // Profile Picture
    photoURL: string;

    // Account Info
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthDate: string;

    // New kids field
    kids?: KidInfo[];
}