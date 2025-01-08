// hooks/useSignupForm.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SignupFormData, SignupStep, KidInfo } from '../../../../types/signup.types';
import { auth, db } from '@/app/lib/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';

// Type guard improvement
const isValidUsername = (username: string | undefined): username is string => {
    return typeof username === 'string' && username.length >= 3; // Added minimum length check
};

interface SignupStore {
    currentStep: SignupStep;
    formData: Partial<SignupFormData>;
    isSubmitting: boolean;
    error: string | null;
    setCurrentStep: (step: SignupStep) => void;
    updateFormData: (data: Partial<SignupFormData>) => void;
    resetForm: () => void;
    submitForm: () => Promise<void>;
    addKid: (kid: KidInfo) => void;
    removeKid: (index: number) => void;
}

export const useSignupForm = create<SignupStore>()(
    persist(
        (set, get) => ({
            currentStep: 'basic-info',
            formData: {
                email: '',
                password: '',
                username: '',
                photoURL: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                birthDate: '',
            },
            isSubmitting: false,
            error: null,
            addKid: (kid) => {
                set(state => ({
                    formData: {
                        ...state.formData,
                        kids: [...(state.formData.kids || []), kid]
                    }
                }));
            },
            removeKid: (index) => {
                set(state => ({
                    formData: {
                        ...state.formData,
                        kids: state.formData.kids?.filter((_, i) => i !== index)
                    }
                }));
            },
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
                    // Validation
                    if (!formData.email || !formData.password || !isValidUsername(formData.username)) {
                        throw new Error('Please fill in all required fields');
                    }

                    // Create user account
                    const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        formData.email,
                        formData.password
                    );
                    const user = userCredential.user;

                    // Prepare user data
                    const userData = {
                        username: formData.username,
                        email: formData.email,
                        photoURL: formData.photoURL || '',
                        firstName: formData.firstName || '',
                        lastName: formData.lastName || '',
                        phoneNumber: formData.phoneNumber || '',
                        birthDate: formData.birthDate || '',
                        createdAt: serverTimestamp(),
                        uid: user.uid
                    };

                    // Transaction to create both documents
                    await runTransaction(db, async (transaction) => {
                        // Use collection references
                        const usernamesRef = collection(db, 'usernames');
                        const usernameDocRef = doc(usernamesRef, formData.username);
                        const userDocRef = doc(db, 'account_info', user.uid);

                        const usernameDoc = await transaction.get(usernameDocRef);

                        if (usernameDoc.exists()) {
                            throw new Error('Username is already taken');
                        }

                        // Set both documents
                        transaction.set(usernameDocRef, {
                            uid: user.uid,
                            username: formData.username,
                            createdAt: serverTimestamp()
                        });

                        transaction.set(userDocRef, userData);
                    });

                    // Update auth profile
                    await updateProfile(user, {
                        displayName: formData.username,
                        photoURL: formData.photoURL || ''
                    });

                    // Reset form
                    get().resetForm();

                    // Force reload user data
                    await user.reload();

                    // Redirect
                    window.location.href = `/${formData.username}`;

                } catch (error) {
                    console.error('Signup error:', error);
                    set({ error: error instanceof Error ? error.message : 'An error occurred' });
                    throw error;
                } finally {
                    set({ isSubmitting: false });
                }
            }
        }),
        {
            name: 'signup-storage',
            partialize: (state) => ({
                formData: state.formData,
                currentStep: state.currentStep
            })
        }
    )
);