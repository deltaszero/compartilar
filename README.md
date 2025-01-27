# CompartiLar

[![wakatime](https://wakatime.com/badge/user/018d43b8-0657-4341-8350-d2bec44cda7a/project/f920cf64-ad85-41bc-bd1e-e49e03f30ece.svg)](https://wakatime.com/badge/user/018d43b8-0657-4341-8350-d2bec44cda7a/project/f920cf64-ad85-41bc-bd1e-e49e03f30ece)

```tsx
'use client';
// Firebase Core Imports
import { initializeApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
// Firebase Authentication
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// Firebase Firestore
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    doc,
    setDoc
} from 'firebase/firestore';
// Firebase Storage
import { getStorage } from 'firebase/storage';
// Local Types and Config
import { SignupFormData, SignupStep, KidInfo } from '@/types/signup.types';
import { auth, db } from '@/app/lib/firebaseConfig';
            
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
            
interface SignupStore {
    {/* TYPES HERE */}
}

export default function SignupPage() {
    persist(
        (set, get) => ({
            {/* updateFormData */}
            {/* resetFormData */}
            {/* addKid */}
            {/* removeKid */} 
            {/* submitForm */}
            {/* currentStep */}
        }),
        {
            name: 'signup-store',
            partialize: (state) => ({
                {/* formData */}
                {/* currentStep */}
            }),
        }
    return (
        <div>
            <div>
                {/* ADD ACCOUNT INFO */}   
            </div>
            <div>
                {/* ADD BASIC INFO */}
            </div>
            <div>
                {/* ADD KIDS */}
            </div>
        </div>
    );
}
```


```tsx
'use client'; // Add this at the top to make it a client component
import React from 'react';
import { usePathname } from 'next/navigation';
import { SignupStep } from '@/types/signup.types';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const currentStep = pathname.split('/').pop() as SignupStep;
    const stepsOrder = Object.values(SignupStep);

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg p-6 flex flex-row space-x-12">
                {/* STEP INDICATOR */}
                <div className="steps steps-vertical w-1/4">
                    {stepsOrder.map((step, index) => {
                        const isActive = step === currentStep;
                        const isCompleted = stepsOrder.indexOf(step) < stepsOrder.indexOf(currentStep);
                        
                        return (
                            <div 
                                key={step}
                                className={`step ${isActive ? 'step-primary' : ''} ${isCompleted ? 'step-success' : ''}`}
                                data-content={isCompleted ? '✓' : index + 1}
                            >
                                <span className="hidden md:inline">
                                    {step.replace(/-/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* CONTENT CONTAINER */}
                <div className="step-content w-3/4">
                    {children}
                </div>
            </div>
        </div>
    );
}
```
