// components/SignupProgress.tsx
import { SignupStep } from '../types/signup.types';

interface SignupProgressProps {
    currentStep: SignupStep;
}

export const SignupProgress = ({ currentStep }: SignupProgressProps) => {
    const steps = [
        { id: 'basic-info', label: 'Informações Básicas' },
        { id: 'profile-picture', label: 'Foto do Perfil' },
        { id: 'account-info', label: 'Dados da Conta' },
    ];

    return (
        <ul className="steps steps-vertical w-full">
            {steps.map((step) => (
                <li
                    key={step.id}
                    className={`step ${currentStep === step.id ||
                            steps.findIndex(s => s.id === currentStep) >
                            steps.findIndex(s => s.id === step.id)
                            ? 'step-primary'
                            : ''
                        }`}
                >
                    {step.label}
                </li>
            ))}
        </ul>
    );
};