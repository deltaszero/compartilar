// context/userContext.tsx
'use client';

import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { auth, db, markFirestoreListenersActive, markFirestoreListenersInactive, addFirestoreListener, getUserChildren } from '@/app/lib/firebaseConfig';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, where, disableNetwork, enableNetwork, or } from 'firebase/firestore';
import { KidInfo } from '@/types/signup.types';

interface UserData {
    username: string;
    email: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    birthDate?: string;
    gender?: string;
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
        let unsubscribeUser: (() => void) | undefined;
        let unsubscribeKids: (() => void) | undefined;

        // Helper function to clean up Firestore listeners
        const cleanupListeners = async () => {
            // Use our central management system to clean up listeners
            markFirestoreListenersInactive();
            
            // Reset local references
            if (unsubscribeUser) {
                unsubscribeUser = undefined;
            }
            if (unsubscribeKids) {
                unsubscribeKids = undefined;
            }
            
            // Temporarily disable Firestore network to force close any hanging connections
            try {
                await disableNetwork(db);
                // Small delay to ensure disconnection completes
                await new Promise(resolve => setTimeout(resolve, 50));
                await enableNetwork(db);
            } catch (error) {
                console.log("Error toggling Firestore network:", error);
                // Non-critical error, continue
            }
        };

        const initializeAuth = async () => {
            await setPersistence(auth, browserLocalPersistence);
            return onAuthStateChanged(auth, async (currentUser) => {
                // Always clean up previous listeners when auth state changes
                await cleanupListeners();
                
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
                    
                    // Mark listeners as active before subscribing
                    markFirestoreListenersActive();

                    // Ensure user ID token is refreshed before listening to Firestore
                    // This ensures Firebase knows the user is authenticated before any Firestore queries
                    await currentUser.getIdTokenResult(true);
                    
                    // Subscribe to user data using our safe listener manager
                    const userRef = doc(db, 'users', currentUser.uid);
                    
                    // Create user listener
                    unsubscribeUser = addFirestoreListener(
                        `user_${currentUser.uid}`, 
                        () => {
                            return onSnapshot(
                                userRef, 
                                async (doc) => {
                                    if (!doc.exists()) {
                                        setLoading(false);
                                        return;
                                    }
        
                                    const userData = doc.data() as UserData;
        
                                    // Validate document ownership
                                    if (userData.uid !== currentUser.uid) {
                                        console.error('Document UID mismatch');
                                        setLoading(false);
                                        return;
                                    }
        
                                    // Subscribe to children data using the new permission model
                                    const childrenRef = collection(db, 'children');
                                    
                                    // Query children where the user has either viewer or editor permission
                                    const kidsQuery = query(
                                        childrenRef,
                                        or(
                                            where('viewers', 'array-contains', currentUser.uid),
                                            where('editors', 'array-contains', currentUser.uid)
                                        )
                                    );
        
                                    // Use safe listener management for kids data too
                                    unsubscribeKids = addFirestoreListener(
                                        `kids_${currentUser.uid}`,
                                        () => {
                                            return onSnapshot(kidsQuery, (snapshot) => {
                                                const kids = snapshot.docs.reduce((acc, doc) => {
                                                    const kidData = doc.data() as KidInfo;
                                                    // Add access level information
                                                    const accessLevel = kidData.editors?.includes(currentUser.uid) 
                                                        ? 'editor' 
                                                        : 'viewer';
                                                    
                                                    acc[doc.id] = {
                                                        ...kidData,
                                                        id: doc.id,
                                                        accessLevel
                                                    };
                                                    return acc;
                                                }, {} as Record<string, KidInfo>);
        
                                                setKidsData(kids);
                                            });
                                        }
                                    );
        
                                    // Set user data
                                    setUserData(userData);
                                    setLoading(false);
                                },
                                (error) => {
                                    console.error('User data error:', error);
                                    setLoading(false);
                                }
                            );
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
            cleanupListeners();
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

