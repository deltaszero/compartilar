// app/login/page.tsx
'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { auth } from '@lib/firebaseConfig';
import NavLink from '@components/ui/NavLink';
import LoginHeader from "@components/layout/LoginHeader";
import { CustomTypingEffect } from '@/app/components/layout/CustomTypingEffect';

import background_img from "@assets/images/e7f07729-4789-4da8-bfc4-241153ee5040_0.png";

export default function LoginPage() {
    const [hasHydrated, setHasHydrated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/login/redirect');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Sidebar */}
            <div className="hidden lg:flex relative w-full h-full text-4xl font-nunito bg-neutral text-base-100">
                {/* Absolute Image */}
                <Image
                    src={background_img}
                    alt="Background"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                    unoptimized
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gray-900 opacity-90" />
                {/* Typing Effect on Top */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full h-full">
                <CustomTypingEffect />
                </div>
                </div>
            {/* Right Content */}
            <div className="flex flex-col bg-base-100 py-4">
                <div className='text-primary'>
                    <LoginHeader />
                </div>
                <section className="flex-1 flex flex-col justify-center items-center">
                    <div className="flex flex-col gap-4">
                        <div className="flex-col">
                            <form onSubmit={handleLogin} className="form-control gap-4" suppressHydrationWarning>
                            {hasHydrated ? (
                            <>
                                {/* email */}
                                <label className="input input-bordered w-full max-w-xs rounded-lg flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        className="h-4 w-4 opacity-70 text-neutral">
                                        <path
                                            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                                        <path
                                            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                                    </svg>
                                    <input 
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        suppressHydrationWarning
                                    />
                                </label>
                                {/* password */}
                                <label className="input input-bordered w-full max-w-xs rounded-lg flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        className="h-4 w-4 opacity-70 text-neutral">
                                        <path
                                            fillRule="evenodd"
                                            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                                            clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        suppressHydrationWarning
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
                                {/* submit */}
                                <button
                                    type="submit"
                                    className="btn btn-outline btn-primary w-full max-w-xs rounded-lg border-primary font-nunito font-bold"
                                >
                                    Entrar
                                </button>
                                </>
                            ) : (
                                <div className="w-full h-48 flex items-center justify-center">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            )}
                            </form>
                        
                        </div>
                        <div className="divider"></div>
                        <div className="flex-col">
                            <p>
                                Não tem uma conta? <span className="text-primary hover:decoration-none hover:font-bold"><NavLink href="/signup">Cadastre-se</NavLink></span>
                            </p>
                            <p>
                                Esqueceu a senha? <span className="text-primary hover:decoration-none hover:font-bold"><NavLink href="/reset-password">Recuperar Senha</NavLink></span>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
