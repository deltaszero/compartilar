// types/signup.types.ts
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
}

export type SignupStep = 'basic-info' | 'profile-picture' | 'account-info';