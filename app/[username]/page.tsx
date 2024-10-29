// app/[username]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../services/firebaseConfig'; // Adjust the path as necessary
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface UserData {
    username: string;
    email: string;
    // Add other user fields if necessary
}

export default function UserPage() {
    const { username } = useParams();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // avoid 'currentUser' is declared but its value is never read.ts(6133)
    console.log(currentUser);

    useEffect(() => {
        console.log('Username from useParams:', username); // For debugging

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);

                // Fetch the user's data from Firestore
                const docRef = doc(db, 'account_info', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserData;

                    if (data.username === username) {
                        setUserData(data);
                    } else {
                        // If the username in the URL doesn't match the logged-in user
                        router.push('/');
                    }
                } else {
                    console.log('No user data found in Firestore');
                    router.push('/');
                }
            } else {
                // User is not logged in
                router.push('/login');
            }
        });

        return () => {
            unsubscribe();
        };
    }, [username, router]);

    if (!userData) {
        return <div>Loading...</div>;
    }

    return (
        <section className="flex flex-col justify-center items-center min-h-screen">
            <div>
                <h1>Hello, {userData.username}!</h1>
                <p>Your email: {userData.email}</p>
                {/* Display other user info as needed */}
            </div>
        </section>
    );
}
