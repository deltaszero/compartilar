// hooks/useSignupForm.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SignupFormData, SignupStep } from '../types/signup.types';

interface SignupStore {
    currentStep: SignupStep;
    formData: Partial<SignupFormData>;
    setCurrentStep: (step: SignupStep) => void;
    updateFormData: (data: Partial<SignupFormData>) => void;
    resetForm: () => void;
}

const initialFormData: Partial<SignupFormData> = {
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    photoURL: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
};

export const useSignupForm = create<SignupStore>()(
    persist(
        (set) => ({
            currentStep: 'basic-info',
            formData: initialFormData,
            setCurrentStep: (step) => set({ currentStep: step }),
            updateFormData: (data) =>
                set((state) => ({
                    formData: { ...state.formData, ...data },
                })),
            resetForm: () =>
                set({ currentStep: 'basic-info', formData: initialFormData }),
        }),
        {
            name: 'signup-storage',
        }
    )
);