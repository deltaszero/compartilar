'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@lib/firebaseConfig';
import LoginHeader from "@/app/components/LoginHeader";


export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Email de recuperação enviado!');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <LoginHeader />
            <section className="flex-1 flex flex-col justify-center items-center">
                <div className="flex flex-col gap-4 items-center">
                    <p>
                        Insira seu email para recuperar a senha:
                    </p>
                    <form onSubmit={handleReset}  className="form-control gap-4">
                        <label className="relative w-full max-w-xs">
                            <input 
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                className="input input-bordered w-full rounded-lg"
                            />
                        </label>
                        <button 
                            type="submit"
                            className="btn w-full max-w-xs rounded-lg bg-secondaryPurple text-black hover:text-white font-normal"
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
