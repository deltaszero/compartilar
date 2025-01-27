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