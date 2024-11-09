// app/signup/page.tsx
'use client';

import { useEffect } from 'react';
import { SignupProgress } from './components/SignupProgress';
import { BasicInfoStep } from './components/BasicInfoStep';
import { ProfilePictureStep } from './components/ProfilePictureStep';
import { AccountInfoStep } from './components/AccountInfoStep';
import { useSignupForm } from './hooks/useSignupForm';
import LoginHeader from "@components/layout/LoginHeader";
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const {
        currentStep,
        setCurrentStep,
        submitForm,
        isSubmitting,
        error,
        formData
    } = useSignupForm();
    const router = useRouter();

    const handleNext = () => {
        // Add validation logic here before proceeding
        if (currentStep === 'basic-info') {
            if (!formData.email || !formData.password || !formData.username) {
                alert('Please fill in all required fields');
                return;
            }
            setCurrentStep('profile-picture');
        } else if (currentStep === 'profile-picture') {
            setCurrentStep('account-info');
        }
    };

    const handleBack = () => {
        if (currentStep === 'profile-picture') {
            setCurrentStep('basic-info');
        } else if (currentStep === 'account-info') {
            setCurrentStep('profile-picture');
        }
    };

    const handleSubmit = async () => {
        try {
            await submitForm();
            router.push('/');
        } catch (error) {
            console.error('Signup error:', error);
            // Error is already handled in the store
        }
    };

    // Display error if exists
    useEffect(() => {
        if (error) {
            alert(error);
        }
    }, [error]);

    const renderStep = () => {
        switch (currentStep) {
            case 'basic-info':
                return <BasicInfoStep />;
            case 'profile-picture':
                return <ProfilePictureStep />;
            case 'account-info':
                return <AccountInfoStep />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <LoginHeader />
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <SignupProgress currentStep={currentStep} />
                    </div>
                    <div className="col-span-3">
                        {renderStep()}
                        <div className="mt-6 flex justify-between">
                            {currentStep !== 'basic-info' && (
                                <button
                                    className="btn btn-outline"
                                    onClick={handleBack}
                                    disabled={isSubmitting}
                                >
                                    Voltar
                                </button>
                            )}
                            {currentStep !== 'account-info' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                >
                                    Próximo
                                </button>
                            )}
                            {currentStep === 'account-info' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
