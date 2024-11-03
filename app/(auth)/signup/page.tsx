// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
    doc,
    // setDoc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { auth, db } from '@lib/firebaseConfig';
import LoginHeader from "@components/layout/LoginHeader";

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(true);

    const [passwordStrong, setPasswordStrong] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Step 1: Check if the username is already taken
            const usernameDocRef = doc(db, 'usernames', username);
            const usernameDoc = await getDoc(usernameDocRef);
            if (usernameDoc.exists()) {
                alert('Nome de usuário já está em uso. Por favor, escolha outro.');
                setLoading(false);
                return;
            }
            // Step 2: Create the user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Step 3: Use a transaction to reserve the username and create account_info
            await runTransaction(db, async (transaction) => {
                // Check again if the username is taken within the transaction
                const usernameDoc = await transaction.get(usernameDocRef);
                if (usernameDoc.exists()) {
                    throw new Error('Nome de usuário já está em uso. Por favor, escolha outro.');
                }
                // Reserve the username
                transaction.set(usernameDocRef, { uid: user.uid });
                // Set user data in account_info
                const userDocRef = doc(db, 'account_info', user.uid);
                transaction.set(userDocRef, {
                    username: username,
                    email: email,
                    photoURL: '',
                    createdAt: serverTimestamp(),
                });
            });
            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: username,
            });
            router.push('/');
        } catch (error) {
            console.error('Error during signup:', error);
            alert(error || 'Ocorreu um erro ao criar a conta.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrong(newPassword.length >= 6);
    };

    return (
        <div className="h-screen flex flex-col">
            <LoginHeader />
            <section className="flex-1 flex flex-col justify-center items-center">
                <div className="flex flex-col gap-4 items-center">
                    <form onSubmit={handleSignup} className="form-control gap-4">
                        {/* email */}
                        <label className="w-full max-w-xs">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input input-bordered w-full rounded-lg"
                            />
                        </label>
                        {/* password */}
                        <div
                            className={
                                `tooltip tooltip-open tooltip-right ${passwordStrong ? 'tooltip-success' : 'tooltip-warning'}`
                            }
                            data-tip={
                                passwordStrong ? 'Senha forte o suficiente' : 'A senha deve ter pelo menos 6 caracteres'
                            }
                        >
                            <label className="relative w-full max-w-xs">
                                <input
                                    type="password"
                                    placeholder="Senha"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="input input-bordered w-full rounded-lg"
                                />
                            </label>
                        </div>
                        {/* username */}
                        <label className="w-full max-w-xs">
                            <input
                                type="text"
                                placeholder="Nome de usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="input input-bordered w-full rounded-lg"
                            />
                        </label>
                        {/* submit */}
                        <button
                            type="submit"
                            className="btn w-full max-w-xs rounded-lg bg-secondaryPurple text-black hover:text-white font-normal"
                            disabled={!passwordStrong} // Desabilita o botão se a senha for fraca
                        >
                            Cadastrar
                        </button>
                    </form>
                    <p>
                        Já tem uma conta? <a href="/login">Entrar</a>
                    </p>
                </div>
            </section>
        </div>
    );
}
