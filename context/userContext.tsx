// context/userContext.tsx
'use client';

import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { auth, db, markFirestoreListenersActive, markFirestoreListenersInactive, addFirestoreListener, getUserChildren, firestoreListenersActive } from '@/app/lib/firebaseConfig';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, doc, onSnapshot, query, serverTimestamp, where, disableNetwork, enableNetwork, or } from 'firebase/firestore';
import { KidInfo } from '@/types/signup.types';

interface SubscriptionData {
    active: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan: 'free' | 'premium';
    status?: string;
    updatedAt?: string;
}

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
    subscription?: SubscriptionData;
    displayName?: string; // Added to support displayName field
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
        let isAuthInitialized = false;
        // Track if this component instance's listeners should be active
        let isComponentMounted = true;

        // Helper function to clean up Firestore listeners
        const cleanupListeners = async () => {
            console.log("Cleaning up Firestore listeners");
            
            // Manually unsubscribe from any local listeners
            if (unsubscribeUser) {
                try {
                    unsubscribeUser();
                    console.log("Manually unsubscribed from user listener");
                } catch (e) {
                    console.log("Error unsubscribing from user listener:", e);
                }
                unsubscribeUser = undefined;
            }
            
            if (unsubscribeKids) {
                try {
                    unsubscribeKids();
                    console.log("Manually unsubscribed from kids listener");
                } catch (e) {
                    console.log("Error unsubscribing from kids listener:", e);
                }
                unsubscribeKids = undefined;
            }
            
            // Use our central management system to clean up all listeners
            // This will also reset the Firestore connection
            try {
                await markFirestoreListenersInactive();
            } catch (error) {
                console.error("Error in listener cleanup manager:", error);
                // Even if the listener manager fails, we should still clean up local references
                // and continue with other cleanup operations
            }
            
            // Clear user data if needed
            if (!isAuthInitialized) {
                setUserData(null);
                setKidsData({});
            }
        };

        const initializeAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                return onAuthStateChanged(auth, async (currentUser) => {
                    console.log("Auth state changed:", currentUser ? `User ${currentUser.uid}` : "No user");
                    isAuthInitialized = true;
                    
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
                    // Force a single token refresh to ensure latest claims
                    // Get both token and token result at once to avoid multiple refreshes
                    const [_, tokenResult] = await Promise.all([
                        currentUser.getIdToken(true),
                        currentUser.getIdTokenResult(true)
                    ]);
                    console.log("Token refreshed for user:", currentUser.uid);
                    console.log("Token expiration:", new Date(tokenResult.expirationTime));
                    
                    // Add a delay before setting up Firestore listeners
                    // This helps ensure Firebase Auth state is fully propagated
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Only proceed if component is still mounted
                    if (!isComponentMounted) {
                        console.log("Component unmounted during auth initialization, skipping listener setup");
                        return;
                    }
                    
                    // Mark listeners as active before subscribing
                    markFirestoreListenersActive();
                    console.log("Listeners marked as active");
                    
                    // Subscribe to user data using our safe listener manager
                    const userRef = doc(db, 'users', currentUser.uid);
                    console.log("Setting up user data listener");
                    
                    // Create user listener
                    unsubscribeUser = addFirestoreListener(
                        `user_${currentUser.uid}`, 
                        () => {
                            return onSnapshot(
                                userRef, 
                                {
                                    next: async (doc) => {
                                        console.log("User data updated");
                                        if (!doc.exists()) {
                                            console.log("User document doesn't exist");
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
                                        
                                        // Set user data first to ensure UI can render
                                        setUserData(userData);
                                        setLoading(false);
        
                                        // Add a delay before setting up children listener
                                        // to avoid parallel listener creation
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        
                                        // Skip setting up the listener if either the component is unmounted
                                        // or the global listeners are marked as inactive
                                        if (!isComponentMounted || !firestoreListenersActive) {
                                            console.log("Skipping children listener setup - listeners inactive or component unmounted");
                                            return;
                                        }
        
                                        // Subscribe to children data using the new permission model
                                        const childrenRef = collection(db, 'children');
                                        console.log("Setting up children data listener");
                                        
                                        try {
                                            // Query children where the user has either viewer or editor permission
                                            const kidsQuery = query(
                                                childrenRef,
                                                or(
                                                    where('viewers', 'array-contains', currentUser.uid),
                                                    where('editors', 'array-contains', currentUser.uid)
                                                )
                                            );
            
                                            // Unsubscribe from previous kids listener if it exists
                                            if (unsubscribeKids) {
                                                try {
                                                    unsubscribeKids();
                                                    console.log("Unsubscribed from previous kids listener");
                                                } catch (e) {
                                                    console.log("Error unsubscribing from kids listener:", e);
                                                }
                                                unsubscribeKids = undefined;
                                            }
            
                                            // Use safe listener management for kids data too
                                            unsubscribeKids = addFirestoreListener(
                                                `kids_${currentUser.uid}`,
                                                () => {
                                                    return onSnapshot(
                                                        kidsQuery, 
                                                        {
                                                            next: (snapshot) => {
                                                                console.log("Children data updated");
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
                                                            },
                                                            error: (error) => {
                                                                // Silently handle permission errors
                                                                if (error.code === 'permission-denied') {
                                                                  console.log('Children data permission denied - expected for some security rules');
                                                                } else {
                                                                  console.error('Children data error:', error);
                                                                }
                                                            }
                                                        }
                                                    );
                                                }
                                            );
                                        } catch (error) {
                                            // Silently handle permission errors
                                            if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
                                              console.log('Error setting up children listener - permission denied');
                                            } else {
                                              console.error('Error setting up children listener:', error);
                                            }
                                        }
                                    },
                                    error: (error) => {
                                        // Silently handle permission errors
                                        if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
                                          console.log('User data permission denied - expected for some security rules');
                                        } else {
                                          console.error('User data error:', error);
                                        }
                                        setLoading(false);
                                    }
                                }
                            );
                        }
                    );
                } catch (error) {
                    console.error('Auth sync error:', error);
                    setLoading(false);
                }
            });
            }
            catch (error) {
                console.error('Error in auth initialization:', error);
                setLoading(false);
            }
        };

        const unsubscribePromise = initializeAuth();

        return () => {
            console.log("UserContext cleanup triggered");
            // Mark component as unmounted first
            isComponentMounted = false;
            
            // First unsubscribe from auth listener
            unsubscribePromise.then(fn => {
                try {
                    if (typeof fn === 'function') {
                        fn();
                        console.log("Unsubscribed from auth listener");
                    } else {
                        console.log("No auth listener to unsubscribe (not a function)");
                    }
                } catch (e) {
                    console.error("Error unsubscribing from auth listener:", e);
                }
                
                // Then clean up all Firestore listeners
                cleanupListeners().catch(e => {
                    console.error("Error in final listener cleanup:", e);
                });
            }).catch(e => {
                console.error("Error in auth unsubscribe promise:", e);
                // Still try to clean up listeners
                cleanupListeners().catch(e => {
                    console.error("Error in final listener cleanup:", e);
                });
            });
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

