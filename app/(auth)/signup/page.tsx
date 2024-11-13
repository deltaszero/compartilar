// app/signup/page.tsx
'use client';

// importing modules
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// importing components
import LoginHeader from "@components/layout/LoginHeader";
import { SignupProgress } from '@auth/signup/components/SignupProgress';
import { BasicInfoStep } from '@auth/signup/components/BasicInfoStep';
import { ProfilePictureStep } from '@auth/signup/components/ProfilePictureStep';
import { AccountInfoStep } from '@auth/signup/components/AccountInfoStep';
import { useSignupForm } from '@auth/signup/hooks/useSignupForm';


export default function SignupPage() {
    // setting up hooks
    const {
        currentStep,
        setCurrentStep,
        submitForm,
        isSubmitting,
        error,
        formData
    } = useSignupForm();
    const router = useRouter();

    // setting up functions 
    const handleNext = () => {
        // validating form data
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
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 mb-8">
                    <div className="hidden lg:block lg:col-span-1">
                        {/* empty div for desktop layout */}
                    </div>
                    <div className="col-span-1 lg:col-span-3">
                        <div className="flex justify-center lg:justify-start">
                            <LoginHeader />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="hidden lg:block lg:col-span-1">
                        <SignupProgress currentStep={currentStep} />
                    </div>
                    <div className="col-span-1 lg:col-span-3">
                        {renderStep()}
                        <div className="mt-6 flex justify-between">
                            {currentStep !== 'basic-info' && (
                                <button
                                    className="btn btn-outline rounded-md"
                                    onClick={handleBack}
                                    disabled={isSubmitting}
                                >
                                    Voltar
                                </button>
                            )}
                            {currentStep !== 'account-info' && (
                                <button
                                    className="btn btn-primary rounded-md"
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                >
                                    Próximo
                                </button>
                            )}
                            {currentStep === 'account-info' && (
                                <button
                                    className="btn btn-primary rounded-md"
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
