'use client';
import React from 'react';
import Image from 'next/image';
import background_img from "@assets/images/2fcb3a44-26ce-41b7-a181-f6c55f663025.png";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full min-h-screen bg-base-200 relative flex items-center justify-center p-4">
            <Image
                src={background_img}
                alt="Background"
                fill
                className="object-cover"
                priority
                quality={75}
            />
            <div className="absolute inset-0 bg-gray-900 opacity-30" />
            <div className="relative z-10 w-full p-4">
                {children}
            </div>
        </div>
    );
}