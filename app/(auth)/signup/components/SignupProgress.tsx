// app/(auth)/signup/components/SignupProgress.tsx
import { SignupStep } from '@auth/signup/types/signup.types';

interface SignupProgressProps {
    currentStep: SignupStep;
}

export const SignupProgress = ({ currentStep }: SignupProgressProps) => {
    const steps = [
        { id: 'basic-info', label: 'Informações da Conta' },
        { id: 'profile-picture', label: 'Foto do Perfil' },
        { id: 'account-info', label: 'Seus Dados Pessoais' },
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