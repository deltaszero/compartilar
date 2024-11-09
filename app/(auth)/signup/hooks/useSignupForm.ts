// hooks/useSignupForm.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SignupFormData, SignupStep } from '../types/signup.types';
import { auth, db } from '@/app/lib/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

interface SignupStore {
    currentStep: SignupStep;
    formData: Partial<SignupFormData>;
    isSubmitting: boolean;
    error: string | null;
    setCurrentStep: (step: SignupStep) => void;
    updateFormData: (data: Partial<SignupFormData>) => void;
    resetForm: () => void;
    submitForm: () => Promise<void>;
}

export const useSignupForm = create<SignupStore>()(
    persist(
        (set, get) => ({
            currentStep: 'basic-info',
            formData: {
                email: '',
                password: '',
                confirmPassword: '',
                username: '',
                photoURL: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                birthDate: '',
            },
            isSubmitting: false,
            error: null,
            setCurrentStep: (step) => set({ currentStep: step }),
            updateFormData: (data) =>
                set((state) => ({
                    formData: { ...state.formData, ...data },
                })),
            resetForm: () =>
                set({
                    currentStep: 'basic-info',
                    formData: {},
                    error: null,
                    isSubmitting: false,
                }),
            submitForm: async () => {
                const { formData } = get();
                set({ isSubmitting: true, error: null });

                try {
                    // Validate required fields
                    if (!formData.email || !formData.password || !formData.username) {
                        throw new Error('Please fill in all required fields');
                    }

                    // Check if username is available
                    const usernameDocRef = doc(db, 'usernames', formData.username);
                    const usernameDoc = await getDoc(usernameDocRef);

                    if (usernameDoc.exists()) {
                        throw new Error('Username is already taken');
                    }

                    // Create user account
                    const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        formData.email,
                        formData.password
                    );
                    const user = userCredential.user;

                    // Use transaction to create user documents
                    await runTransaction(db, async (transaction) => {
                        // Double-check username availability in transaction
                        const usernameDoc = await transaction.get(usernameDocRef);
                        if (usernameDoc.exists()) {
                            throw new Error('Username is already taken');
                        }

                        // Reserve username
                        transaction.set(usernameDocRef, { uid: user.uid });

                        // Create account info document
                        const userDocRef = doc(db, 'account_info', user.uid);
                        transaction.set(userDocRef, {
                            username: formData.username,
                            email: formData.email,
                            photoURL: formData.photoURL || '',
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phoneNumber: formData.phoneNumber,
                            birthDate: formData.birthDate,
                            createdAt: serverTimestamp(),
                        });
                    });

                    // Update Firebase Auth profile
                    await updateProfile(user, {
                        displayName: formData.username,
                        photoURL: formData.photoURL || '',
                    });

                    // Reset form after successful submission
                    get().resetForm();

                    // Redirect to home page
                    window.location.href = '/';

                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'An error occurred' });
                    throw error;
                } finally {
                    set({ isSubmitting: false });
                }
            },
        }),
        {
            name: 'signup-storage',
        }
    )
);