'use client';
import React from 'react';
import { SignupStep } from '@/types/signup.types';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg p-6 flex flex-row space-x-12">
                {/* STEP INDICATOR */}
                <div className="steps steps-vertical w-1/4">
                    {Object.values(SignupStep).map((step) => (
                        <div 
                            key={step}
                            className={`step ${step === SignupStep.BASIC_INFO ? 'step-primary' : ''}`}
                            data-content={step === SignupStep.BASIC_INFO ? '✓' : ''}
                        >
                            <span className="hidden md:inline">
                                {step.replace('-', ' ').toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
                {/* CONTENT CONTAINER */}
                <div className="step-content w-3/4">
                    {children}
                </div>
            </div>
        </div>
    );
}