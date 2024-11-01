// app/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@lib/firebaseConfig';
import LoginHeader from "@components/layout/LoginHeader";


export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Email de recuperação enviado!');
        } catch (error) {
            console.error(error);
            // Trate os erros conforme necessário
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <LoginHeader />
            <h1>Recuperar Senha</h1>
            <form onSubmit={handleReset}>
                <input type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}
