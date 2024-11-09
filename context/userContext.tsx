'use client';

import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '@/app/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface UserData {
    username: string;
    email: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    birthDate?: string;
    createdAt?: typeof serverTimestamp;
    uid: string;
}

interface UserContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    userData: null,
    loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeFirestore: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            console.log('Auth state changed:', currentUser?.uid);
            setUser(currentUser);
            
            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'account_info', currentUser.uid);
                    unsubscribeFirestore = onSnapshot(
                        userDocRef, 
                        (doc) => {
                            console.log('Firestore data:', doc.data());
                            if (doc.exists()) {
                                setUserData(doc.data() as UserData);
                            } else {
                                console.error('No user data found in Firestore');
                                setUserData(null);
                            }
                            setLoading(false);
                        },
                        (error) => {
                            console.error('Error fetching user data:', error);
                            setLoading(false);
                        }
                    );
                } catch (error) {
                    console.error('Error setting up Firestore listener:', error);
                    setLoading(false);
                }
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    return (
        <UserContext.Provider value={{ user, userData, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = React.useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};