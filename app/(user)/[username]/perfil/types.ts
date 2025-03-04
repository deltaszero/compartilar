export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
    uid?: string;
    about?: string;
}

export interface KidInfo {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: "male" | "female" | "other" | null;
    relationship: "biological" | "adopted" | "guardian" | null;
    photoURL?: string | null;
}