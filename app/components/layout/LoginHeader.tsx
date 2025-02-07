// app/components/layout/LoginHeader.tsx
'use client';
// importing modules
import React from 'react';
// importing assets
import TreeIcon from '@assets/icons/tree.svg';

const LoginHeader = () => {
    return (
        <header className="flex justify-center items-center p-0">
            <a href="/">
                <div className="flex items-center justify-center space-x-2">
                    <TreeIcon width={32} height={32} />
                    <p className="text-2xl font-cinzel font-bold">
                        CompartiLar
                    </p>
                </div>
            </a>
        </header>
    );
};

export default LoginHeader;