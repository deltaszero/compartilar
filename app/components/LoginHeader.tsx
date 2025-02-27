// app/components/layout/LoginHeader.tsx
'use client';
// importing modules
import React from 'react';
// importing assets
import HomeIcon from '@assets/icons/hive-home.svg';

const LoginHeader = () => {
    return (
        <header className="flex justify-center items-center p-0">
            <a href="/">
                <div className="flex items-center justify-center space-x-4">
                    <HomeIcon width={28} height={28} />
                    <h1 className="text-3xl font-nunito font-bold uppercase">CompartiLar</h1>
                </div>
            </a>
        </header>
    );
};

export default LoginHeader;