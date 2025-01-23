'use client';
// Firebase Core Imports
// import { initializeApp } from 'firebase/app';
// import { getAnalytics, Analytics } from 'firebase/analytics';
// Firebase Authentication
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// Firebase Firestore
import {
    // initializeFirestore,
    // persistentLocalCache,
    // persistentMultipleTabManager,
    doc,
    setDoc
} from 'firebase/firestore';
// Firebase Storage
// import { getStorage } from 'firebase/storage';
// Local Types and Config
import { SignupFormData, SignupStep, KidInfo } from '@/types/signup.types';
import { auth, db } from '@/app/lib/firebaseConfig';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SignupStore {
    formData: SignupFormData;
    currentStep: SignupStep;
    updateFormData: (data: Partial<SignupFormData>) => void;
    // resetFormData: () => void;
    addKid: (kid: KidInfo) => void;
    removeKid: (kidId: string) => void;
    submitForm: () => Promise<void>;
}

const useSignupStore = create<SignupStore>()(
    persist(
        (set, get) => ({
            // - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // Initial Form Data
            // - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
            //
            updateFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
            //
            // resetFormData: () => set({ formData: { email: '', password: '', confirmPassword: '', username: '', uid: '', photoURL: '', firstName: '', lastName: '', phoneNumber: '', birthDate: '', kids: {} } }),
            //
            addKid: (kid) => set((state) => ({ formData: { ...state.formData, kids: { ...state.formData.kids, [kid.id]: kid } } })),
            removeKid: (kidId) => set((state) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [kidId]: removedKid, ...remainingKids } = state.formData.kids;
                return { formData: { ...state.formData, kids: remainingKids } };
            }),
            //
            submitForm: async () => {
                const { email, password, username, firstName, lastName, phoneNumber, birthDate, kids } = get().formData;
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    await updateProfile(user, { displayName: username });

                    const userData = {
                        uid: user.uid,
                        email: user.email,
                        username,
                        firstName,
                        lastName,
                        phoneNumber,
                        birthDate,
                        kids: Object.keys(kids),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    await setDoc(doc(db, 'account_info', user.uid), userData);

                    for (const kidId in kids) {
                        const kid = kids[kidId];
                        await setDoc(doc(db, 'children', kidId), {
                            ...kid,
                            parentId: user.uid,
                        });
                    }

                    console.log('User created successfully:', user.uid);
                } catch (error) {
                    console.error('Error during signup:', error);
                }
            },
        }),
        {
            name: 'signup-store',
            partialize: (state) => ({
                formData: state.formData,
                currentStep: state.currentStep,
            }),
        }
    )
);

export default function SignupPage() {
    const { 
        formData,
        // currentStep,
        updateFormData,
        addKid,
        removeKid,
        submitForm 
    } = useSignupStore();

    return (
        <div className="p-4">
            <form onSubmit={(e) => {
                e.preventDefault();
                submitForm();
            }} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => updateFormData({ username: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => updateFormData({ firstName: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => updateFormData({ lastName: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="text"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                    className="input input-bordered"
                />
                <input
                    type="date"
                    placeholder="Birth Date"
                    value={formData.birthDate}
                    onChange={(e) => updateFormData({ birthDate: e.target.value })}
                    className="input input-bordered"
                />
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">Add Kids</h3>
                    {Object.values(formData.kids).map((kid) => (
                        <div key={kid.id} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Kid's First Name"
                                value={kid.firstName}
                                onChange={(e) => addKid({ ...kid, firstName: e.target.value })}
                                className="input input-bordered"
                            />
                            <input
                                type="text"
                                placeholder="Kid's Last Name"
                                value={kid.lastName}
                                onChange={(e) => addKid({ ...kid, lastName: e.target.value })}
                                className="input input-bordered"
                            />
                            <input
                                type="date"
                                placeholder="Kid's Birth Date"
                                value={kid.birthDate}
                                onChange={(e) => addKid({ ...kid, birthDate: e.target.value })}
                                className="input input-bordered"
                            />
                            <select
                                value={kid.gender || ''}
                                onChange={(e) => addKid({ ...kid, gender: e.target.value as 'male' | 'female' | 'other' | null })}
                                className="select select-bordered"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <select
                                value={kid.relationship || ''}
                                onChange={(e) => addKid({ ...kid, relationship: e.target.value as 'biological' | 'adopted' | 'guardian' | null })}
                                className="select select-bordered"
                            >
                                <option value="">Select Relationship</option>
                                <option value="biological">Biological</option>
                                <option value="adopted">Adopted</option>
                                <option value="guardian">Guardian</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => removeKid(kid.id)}
                                className="btn btn-error"
                            >
                                Remove
                            </button>
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
                        className="btn btn-secondary"
                    >
                        Add Kid
                    </button>
                </div>
                <button type="submit" className="btn btn-primary">
                    Sign Up
                </button>
            </form>
        </div>
    );
}