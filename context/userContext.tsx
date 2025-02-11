// context/userContext.tsx
'use client';

import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { auth, db } from '@/app/lib/firebaseConfig';
import { onAuthStateChanged, User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { KidInfo } from '@/types/signup.types';

interface UserData {
    username: string;
    email: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    birthDate?: string;
    kids?: Record<string, { id: string }>;
    createdAt?: typeof serverTimestamp;
    uid: string;
}

interface UserContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    isInitialLoad: boolean;
    setIsInitialLoad: (value: boolean) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [kidsData, setKidsData] = useState<Record<string, KidInfo>>({});
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        // Handle initial load
        const loadingTimer = setTimeout(() => {
            setLoading(false);
            setIsInitialLoad(false);
        }, 2000); // Adjust timing based on your needs

        return () => clearTimeout(loadingTimer);
    }, []);

    useEffect(() => {
        let unsubscribeAccount: () => void;
        let unsubscribeKids: () => void;

        const initializeAuth = async () => {
            await setPersistence(auth, browserSessionPersistence);
            return onAuthStateChanged(auth, async (currentUser) => {
                setUser(currentUser);
                if (!currentUser) {
                    setUserData(null);
                    setKidsData({});
                    setLoading(false);
                    return;
                }

                try {
                    // Force token refresh to ensure latest claims
                    await currentUser.getIdToken(true);

                    // Subscribe to account info
                    const accountRef = doc(db, 'account_info', currentUser.uid);
                    unsubscribeAccount = onSnapshot(accountRef,
                        async (doc) => {
                            if (!doc.exists()) {
                                console.log('Account document not found');
                                setLoading(false);
                                return;
                            }

                            const accountData = doc.data() as UserData;

                            // Validate document ownership
                            if (accountData.uid !== currentUser.uid) {
                                console.error('Document UID mismatch');
                                setLoading(false);
                                return;
                            }

                            // Subscribe to children data
                            const kidsQuery = query(
                                collection(db, 'children'),
                                where('parentId', '==', currentUser.uid)
                            );

                            unsubscribeKids = onSnapshot(kidsQuery, (snapshot) => {
                                const kids = snapshot.docs.reduce((acc, doc) => {
                                    const data = doc.data() as KidInfo;
                                    acc[doc.id] = data;
                                    return acc;
                                }, {} as Record<string, KidInfo>);

                                setKidsData(kids);
                            });

                            // Merge account data with kids list
                            setUserData({
                                ...accountData,
                                kids: accountData.kids || {}
                            });
                            setLoading(false);
                        },
                        (error) => {
                            console.error('Account info error:', error);
                            setLoading(false);
                        }
                    );
                } catch (error) {
                    console.error('Auth sync error:', error);
                    setLoading(false);
                }
            });
        };

        const unsubscribeAuth = initializeAuth();

        return () => {
            unsubscribeAuth.then(fn => fn());
            unsubscribeAccount?.();
            unsubscribeKids?.();
        };
    }, []);

    const contextValue = useMemo(() => ({
        user,
        userData: userData ? { ...userData, kids: kidsData } : null,
        loading
    }), [user, userData, kidsData, loading]);

    return (
        <UserContext.Provider value={{
            ...contextValue,
            loading, 
            isInitialLoad, 
            setIsInitialLoad,
        }}>
            {children}
        </UserContext.Provider>
    );
};

