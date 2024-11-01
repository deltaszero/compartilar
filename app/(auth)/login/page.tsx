// app/login/page.tsx
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { auth } from '@lib/firebaseConfig';
import NavLink from '@components/ui/NavLink';
import LoginHeader from "@components/layout/LoginHeader";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <LoginHeader />
            <section className="flex-1 flex flex-col justify-center items-center">
                <div className="flex flex-col gap-4">
                    <div className="flex-col">
                        <form onSubmit={handleLogin} className="form-control gap-4">
                            {/* email */}
                            <label className="input input-bordered w-full max-w-xs rounded-lg flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-4 w-4 opacity-70">
                                    <path
                                    d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                                    <path
                                    d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                                </svg>
                                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                            </label>
                            {/* password */}
                            <label className="input input-bordered w-full max-w-xs rounded-lg flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-4 w-4 opacity-70">
                                    <path
                                        fillRule="evenodd"
                                        d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                                        clipRule="evenodd" />
                                </svg>
                                <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                            </label>
                            {/* submit */}
                            <button type="submit"
                                className="btn w-full max-w-xs rounded-lg bg-secondaryPurple text-black hover:text-white font-normal"
                            >
                                Entrar
                            </button>
                        </form>
                    </div>
                    <div className="divider"></div>
                    <div className="flex-col text-neutral-content font-Raleway">
                        <p>
                            Não tem uma conta? <span className='text-secondaryPurple hover:underline'><NavLink href="/signup">Cadastre-se</NavLink></span>
                        </p>
                        <p>
                            Esqueceu a senha? <span className='text-secondaryPurple hover:underline'><NavLink href="/reset-password">Recuperar Senha</NavLink></span>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
