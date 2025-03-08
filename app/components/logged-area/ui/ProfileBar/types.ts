// ProfileBar/types.ts
export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

export interface UserNavbarProps {
    pathname: string;
    onBackClick?: () => void;
    onSignOut?: () => void;
    userData: {
        username: string;
        photoURL?: string;
        uid?: string;
        firstName?: string;
        lastName?: string;
    } | null;
}

export interface SearchResult {
    uid: string;
    username: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
}