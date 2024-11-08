// context/userContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '@lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';

interface UserData {
    username: string;
    email: string;
    photoURL?: string;
}

interface UserContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    userData: null,
    loading: true,
});


export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const docRef = doc(db, 'account_info', currentUser.uid);
                try {
                    const cachedDoc = await getDocFromCache(docRef);
                    setUserData(cachedDoc.exists() ? cachedDoc.data() as UserData : null);
                } catch (error) {
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data() as UserData);
                    } else {
                        console.error('No user data found in Firestore');
                        setUserData(null);
                    }
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, userData, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);