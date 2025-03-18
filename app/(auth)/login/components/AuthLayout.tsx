'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CustomTypingEffect } from '@/app/components/CustomTypingEffect';

import background_img from "@assets/images/e7f07729-4789-4da8-bfc4-241153ee5040_0.png";
import CompartilarLogo from '@/app/assets/icons/compartilar-icon.svg';
import { Toaster } from "@/components/ui/toaster";

type AuthLayoutProps = {
    children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
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
                        <Toaster />
                    </div>
                </section>
            </div>
        </div>
    );
}