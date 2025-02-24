'use client';
import React from 'react';
import Image from 'next/image';
import background_img from "@assets/images/7689e8be-e10b-4e5c-80b7-61e622491bf9.png";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full min-h-screen bg-base-200 relative flex items-center justify-center p-2">
            <Image
                src={background_img}
                alt="Background"
                fill
                className="object-cover"
                priority
                quality={75}
            />
            <div className="absolute inset-0 bg-gray-900 opacity-80" />
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}