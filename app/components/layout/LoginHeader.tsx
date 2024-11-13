// app/components/layout/LoginHeader.tsx
'use client';
// importing modules
import React from 'react';
// importing assets
import TreeIcon from '@assets/icons/tree.svg';

const LoginHeader = () => {
    return (
        <header className="navbar flex justify-center items-center p-2">
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden"> {/* lg:hidden */}
                    <TreeIcon width={44} height={44} />
                </div>
            </div>
            <div className="hidden lg:flex"> {/* hidden lg:flex */}
                <div className="flex items-center justify-center space-x-2">
                    <TreeIcon width={44} height={44} />
                    <p className="text-3xl font-cinzel font-bold">
                        CompartiLar
                    </p>
                </div>
            </div>
        </header>
    );
};

export default LoginHeader;