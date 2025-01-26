'use client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { SignupFormData, SignupStep, KidInfo } from '@/types/signup.types';
import { auth, db } from '@/app/lib/firebaseConfig';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

interface SignupStore {
    formData: SignupFormData;
    currentStep: SignupStep;
    updateFormData: (data: Partial<SignupFormData>) => void;
    addKid: (kid: KidInfo) => void;
    removeKid: (kidId: string) => void;
    submitForm: () => Promise<void>;
    setCurrentStep: (step: SignupStep) => void;
    validateCurrentStep: () => boolean;
}

const stepsOrder = Object.values(SignupStep);

const useSignupStore = create<SignupStore>()(
    persist(
        (set, get) => ({
            formData: {
                email: '',
                password: '',
                confirmPassword: '',
                username: '',
                uid: '',
                photoURL: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                birthDate: '',
                kids: {},
            },
            currentStep: SignupStep.BASIC_INFO,
            updateFormData: (data) => set((state) => ({ 
                formData: { ...state.formData, ...data } 
            })),
            addKid: (kid) => set((state) => ({
                formData: { 
                    ...state.formData, 
                    kids: { ...state.formData.kids, [kid.id]: kid } 
                }
            })),
            removeKid: (kidId) => set((state) => {
                const { [kidId]: _, ...remainingKids } = state.formData.kids;
                return { formData: { ...state.formData, kids: remainingKids } };
            }),
            submitForm: async () => {
                const { formData } = get();
                try {
                    const userCredential = await createUserWithEmailAndPassword(
                        auth, 
                        formData.email, 
                        formData.password
                    );
                    const user = userCredential.user;

                    await updateProfile(user, { displayName: formData.username });

                    const userData = {
                        uid: user.uid,
                        email: formData.email,
                        username: formData.username,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phoneNumber: formData.phoneNumber,
                        birthDate: formData.birthDate,
                        kids: Object.keys(formData.kids),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    await setDoc(doc(db, 'account_info', user.uid), userData);

                    for (const kidId in formData.kids) {
                        const kid = formData.kids[kidId];
                        await setDoc(doc(db, 'children', kidId), {
                            ...kid,
                            parentId: user.uid,
                        });
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    throw error;
                }
            },
            setCurrentStep: (step) => set({ currentStep: step }),
            validateCurrentStep: () => {
                const { formData, currentStep } = get();
                switch(currentStep) {
                    case SignupStep.BASIC_INFO:
                        return !!formData.email && !!formData.password && 
                               formData.password === formData.confirmPassword;
                    case SignupStep.PROFILE_PICTURE:
                        return !!formData.photoURL;
                    case SignupStep.ACCOUNT_INFO:
                        return !!formData.firstName && !!formData.lastName;
                    default:
                        return true;
                }
            }
        }),
        {
            name: 'signup-store',
            partialize: (state) => ({
                formData: state.formData,
                currentStep: state.currentStep
            }),
        }
    )
);

export default function SignupPage() {
    const { 
        formData,
        currentStep,
        updateFormData,
        addKid,
        removeKid,
        submitForm,
        setCurrentStep,
        validateCurrentStep
    } = useSignupStore();
    
    const currentStepIndex = stepsOrder.indexOf(currentStep);

    const handleStepNavigation = async (direction: 'next' | 'prev') => {
        if (direction === 'next' && !validateCurrentStep()) return;
        
        const newIndex = direction === 'next' 
            ? Math.min(currentStepIndex + 1, stepsOrder.length - 1)
            : Math.max(currentStepIndex - 1, 0);

        setCurrentStep(stepsOrder[newIndex]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep !== SignupStep.VERIFICATION) return;
        try {
            await submitForm();
        } catch (error) {
            console.error('Submission error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* BASIC INFO STEP */}
            {currentStep === SignupStep.BASIC_INFO && (
                <div className="grid grid-cols-1 gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                        className="input input-bordered"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => updateFormData({ password: e.target.value })}
                        className="input input-bordered"
                        minLength={8}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                        className="input input-bordered"
                        required
                    />
                </div>
            )}

            {/* PROFILE PICTURE STEP */}
            {currentStep === SignupStep.PROFILE_PICTURE && (
                <div className="flex flex-col items-center gap-4">
                    <input
                        type="url"
                        placeholder="Profile Image URL"
                        value={formData.photoURL}
                        onChange={(e) => updateFormData({ photoURL: e.target.value })}
                        className="input input-bordered w-full"
                        required
                    />
                    {formData.photoURL && (
                        <img 
                            src={formData.photoURL} 
                            alt="Profile Preview" 
                            className="w-32 h-32 rounded-full object-cover"
                        />
                    )}
                </div>
            )}

            {/* ACCOUNT INFO STEP */}
            {currentStep === SignupStep.ACCOUNT_INFO && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        className="input input-bordered"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        className="input input-bordered"
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                        className="input input-bordered"
                    />
                    <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => updateFormData({ birthDate: e.target.value })}
                        className="input input-bordered"
                    />
                </div>
            )}

            {/* KIDS INFO STEP */}
            {currentStep === SignupStep.KIDS_INFO && (
                <div className="space-y-4">
                    {Object.values(formData.kids).map((kid) => (
                        <div key={kid.id} className="card bg-base-100 p-4 shadow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={kid.firstName}
                                    onChange={(e) => addKid({ ...kid, firstName: e.target.value })}
                                    className="input input-bordered"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={kid.lastName}
                                    onChange={(e) => addKid({ ...kid, lastName: e.target.value })}
                                    className="input input-bordered"
                                />
                                <input
                                    type="date"
                                    value={kid.birthDate}
                                    onChange={(e) => addKid({ ...kid, birthDate: e.target.value })}
                                    className="input input-bordered"
                                />
                                <select
                                    value={kid.gender || ''}
                                    onChange={(e) => addKid({ 
                                        ...kid, 
                                        gender: e.target.value as KidInfo['gender'] 
                                    })}
                                    className="select select-bordered"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeKid(kid.id)}
                                    className="btn btn-error"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addKid({
                            id: Date.now().toString(),
                            firstName: '',
                            lastName: '',
                            birthDate: '',
                            gender: null,
                            relationship: null
                        })}
                        className="btn btn-secondary w-full"
                    >
                        Add Child
                    </button>
                </div>
            )}

            {/* VERIFICATION STEP */}
            {currentStep === SignupStep.VERIFICATION && (
                <div className="card bg-base-100 p-4 shadow">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Review Your Information</h2>
                        <div className="space-y-2">
                            <p><strong>Email:</strong> {formData.email}</p>
                            <p><strong>Username:</strong> {formData.username}</p>
                            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                            <p><strong>Phone:</strong> {formData.phoneNumber}</p>
                            <p><strong>Birth Date:</strong> {formData.birthDate}</p>
                            <div>
                                <strong>Children:</strong>
                                {Object.values(formData.kids).map((kid) => (
                                    <div key={kid.id} className="ml-4">
                                        {kid.firstName} {kid.lastName} ({kid.birthDate})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVIGATION CONTROLS */}
            <div className="flex justify-between">
                {currentStepIndex > 0 && (
                    <button
                        type="button"
                        onClick={() => handleStepNavigation('prev')}
                        className="btn btn-ghost"
                    >
                        ← Previous
                    </button>
                )}
                
                {currentStepIndex < stepsOrder.length - 1 ? (
                    <button
                        type="button"
                        onClick={() => handleStepNavigation('next')}
                        className="btn btn-primary ml-auto"
                        disabled={!validateCurrentStep()}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        type="submit"
                        className="btn btn-success ml-auto"
                    >
                        Complete Registration
                    </button>
                )}
            </div>
        </form>
    );
}