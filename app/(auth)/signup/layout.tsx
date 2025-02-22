'use client';
import React from 'react';
import Image from 'next/image';
import background_img from "@assets/images/d381ebf2-00aa-4419-a6d8-6bb3b71880e8.png";

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
            <div className="absolute inset-0 bg-gray-900 opacity-30" />
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}