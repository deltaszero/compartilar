import React from 'react';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg p-6">
                {/* HEADER */}
                <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
                {/* CONTENT */}
                {children}
            </div>
        </div>
    );
}