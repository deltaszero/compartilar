'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { CustomTypingEffect } from '@/app/components/CustomTypingEffect';

import background_img from "@assets/images/e7f07729-4789-4da8-bfc4-241153ee5040_0.png";
import CompartilarLogo from '@/app/assets/icons/compartilar-icon.svg';
import { Toaster } from "@/components/ui/toaster";

type AuthLayoutProps = {
    children: React.ReactNode;
    showResendEmailLink?: boolean;
    userEmail?: string;
    onResendVerification?: () => Promise<void>;
};

export function AuthLayout({ children, showResendEmailLink = false, userEmail = '', onResendVerification }: AuthLayoutProps) {
    const [resendAttempted, setResendAttempted] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);
    
    const handleResend = async () => {
        if (!onResendVerification || resendLoading || countdown > 0) return;
        
        setResendLoading(true);
        try {
            await onResendVerification();
            setResendAttempted(true);
            setCountdown(60); // 60 second countdown before allowing another resend
        } finally {
            setResendLoading(false);
        }
    };
    
    return (
        <div className="h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Sidebar */}
            <div className="hidden lg:flex relative w-full h-full text-4xl bg-primary text-primary-foreground">
                {/* Background Image */}
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
                <div className="hidden sm:flex sm:flex-col sm:font-raleway sm:relative sm:z-10 sm:justify-center sm:items-center sm:w-full sm:h-full">
                    <CustomTypingEffect />
                </div>
            </div>
            
            {/* Right Content */}
            <div className="flex flex-col bg-bg py-4">
                <div className="flex flex-col items-center justify-center">
                    <Link href="/">
                        <CompartilarLogo width={60} height={60} className="flex-shrink-0 text-main" />
                    </Link>
                </div>
                <section className="flex-1 flex flex-col justify-center items-center">
                    <div className='flex flex-col gap-4 my-[2em] max-w-xs sm:max-w-md'>
                        <div className='font-raleway font-black text-4xl sm:text-6xl'>
                            <p>Coparentalidade</p>
                            <p>sintonizada</p>
                        </div>
                        <div className='font-raleway'>
                            <p>Plataforma de gerencimento familiar que facilita a convivência em lares alternados.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
                        {children}
                        
                        {showResendEmailLink && (
                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex items-start gap-2 text-xs mb-3">
                                    <Info size={16} className="text-main mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600 font-raleway">
                                        Não recebeu o email de verificação? Verifique sua caixa de spam ou solicite um novo email.
                                    </span>
                                </div>
                                
                                {resendAttempted && countdown > 0 ? (
                                    <div className="text-sm text-center">
                                        Email enviado para <span className="font-semibold">{userEmail}</span>. 
                                        Você poderá solicitar um novo email em <span className="font-semibold">{countdown}s</span>.
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        disabled={resendLoading || countdown > 0}
                                        className="w-full text-sm py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition disabled:opacity-50 font-raleway"
                                    >
                                        {resendLoading ? "Enviando..." : "Reenviar email de verificação"}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <Toaster />
                    </div>
                </section>
            </div>
        </div>
    );
}