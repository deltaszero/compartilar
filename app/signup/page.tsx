// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [passwordStrong, setPasswordStrong] = useState(false); // Novo estado
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // await createUserWithEmailAndPassword(auth, email, password);
            // router.push('/'); // Redireciona para a página inicial
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'account_info', user.uid), {
                username: username,
                email: email,
            });

            router.push('/');
        } catch (error) {
            console.error(error);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrong(newPassword.length >= 6);
    };

    return (
        <section className="flex flex-col justify-center items-center min-h-screen">
            <div className="flex flex-col gap-4 items-center">
                <form onSubmit={handleSignup} className="form-control gap-4">
                    {/* email */}
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
                    <label className="relative w-full max-w-xs">
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            className="input input-bordered w-full rounded-lg"
                        />
                        <div
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 tooltip tooltip-open tooltip-right ${passwordStrong ? 'tooltip-success' : 'tooltip-error'
                                }`}
                            data-tip={
                                passwordStrong
                                    ? 'Senha forte o suficiente'
                                    : 'A senha deve ter pelo menos 6 caracteres'
                            }
                        >
                            <span
                                className={`text-xl ${passwordStrong ? 'text-green-500' : 'text-red-500'
                                    }`}
                            >
                                {passwordStrong ? '✔' : '✘'}
                            </span>
                        </div>
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
    );
}
