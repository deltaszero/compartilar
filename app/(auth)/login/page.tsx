// app/login/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, KeyRound } from 'lucide-react';

import { auth } from '@lib/firebaseConfig';
import LoginHeader from "@/app/components/LoginHeader";
import { CustomTypingEffect } from '@/app/components/misc/CustomTypingEffect';
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
            <div className="hidden lg:flex relative w-full h-full text-4xl bg-primary text-primary-foreground">
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
                <div className="hidden sm:flex sm:flex-col sm:font-playfair sm:relative sm:z-10 sm:justify-center sm:items-center sm:w-full sm:h-full">
                    <CustomTypingEffect />
                </div>
            </div>
            {/* Right Content */}
            <div className="flex flex-col bg-background py-4">
                <div className='text-primary'>
                    <LoginHeader />
                </div>
                <section className="flex-1 flex flex-col justify-center items-center">
                    <div className='flex flex-col gap-4 mb-[6em] max-w-xs sm:max-w-md'>
                        <div className='font-playfair font-semibold text-4xl sm:text-6xl'>
                            <p>Coparentalidade</p>
                            <p>sintonizada</p>
                        </div>
                        <div className='font-raleway text-muted-foreground'>
                            <p>Plataforma de gerencimento familiar que facilita a convivência em lares alternados.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <p className='font-raleway'>Que bom te ver de novo!</p>
                        <div className="w-full">
                            <form onSubmit={handleLogin} className="flex flex-col gap-4" suppressHydrationWarning>
                                {hasHydrated ? (
                                    <>
                                        {/* email */}
                                        <InputWithIcon
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            suppressHydrationWarning
                                            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                                        />
                                        
                                        {/* password */}
                                        <InputWithIcon
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Senha"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            suppressHydrationWarning
                                            icon={<KeyRound className="h-4 w-4 text-muted-foreground" />}
                                            rightElement={
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            }
                                        />
                                        
                                        {/* submit */}
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            className="w-full font-nunito font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                        >
                                            Entrar
                                        </Button>
                                    </>
                                ) : (
                                    <div className="w-full h-48 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                )}
                            </form>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex flex-col gap-2 font-raleway">
                            <p>
                                Não tem uma conta? <Link href="/signup" className="text-primary hover:underline font-medium">Cadastre-se</Link>
                            </p>
                            <p>
                                Esqueceu a senha? <Link href="/reset-password" className="text-primary hover:underline font-medium">Recuperar Senha</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
