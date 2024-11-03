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
    const [showPassword, setShowPassword] = useState(false);
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
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Senha"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    className="input input-bordered w-full rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" id="Visible--Streamline-Core" height={14} width={14} ><desc>{"Visible Streamline Icon: https://streamlinehq.com"}</desc><g id="visible--eye-eyeball-open-view"><path id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.23 6.2463c0.1658 0.20672 0.2576 0.47529 0.2576 0.75376s-0.0918 0.54704 -0.2576 0.75376c-1.05 1.27127 -3.44003 3.74628 -6.23003 3.74628s-5.18 -2.47501 -6.230002 -3.74628c-0.16584 -0.20672 -0.257639 -0.47529 -0.257639 -0.75376s0.091799 -0.54704 0.257639 -0.75376C1.81997 4.97503 4.20997 2.5 6.99997 2.5S12.18 4.97503 13.23 6.2463Z" strokeWidth={1} /><path id="Vector_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M7 9c1.10457 0 2 -0.89543 2 -2s-0.89543 -2 -2 -2 -2 0.89543 -2 2 0.89543 2 2 2Z" strokeWidth={1} /></g></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" id="Invisible-1--Streamline-Core" height={14} width={14} ><desc>{"Invisible 1 Streamline Icon: https://streamlinehq.com"}</desc><g id="invisible-1--disable-eye-eyeball-hide-off-view"><path id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M3.62914 3.6244C4.62188 2.9793 5.7722 2.5 6.99997 2.5c2.79 0 5.18003 2.47503 6.23003 3.7463 0.1658 0.20672 0.2576 0.47529 0.2576 0.75376s-0.0918 0.54704 -0.2576 0.75376c-0.5788 0.70075 -1.5648 1.76726 -2.8004 2.58338m-1.92963 0.9325c-0.48238 0.1459 -0.98436 0.2304 -1.5 0.2304 -2.79 0 -5.18 -2.47501 -6.230002 -3.74628 -0.16584 -0.20672 -0.257639 -0.47529 -0.257639 -0.75376s0.091799 -0.54704 0.257639 -0.75376c0.332672 -0.40278 0.799852 -0.92639 1.371652 -1.45383" strokeWidth={1} /><path id="Vector_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M8.41421 8.41427c0.78105 -0.78105 0.78105 -2.04738 0 -2.82843 -0.78105 -0.78104 -2.04737 -0.78104 -2.82842 0" strokeWidth={1} /><path id="Vector_3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5 13.5 0.5 0.5" strokeWidth={1} /></g></svg>
                                    )}
                                </button>
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
