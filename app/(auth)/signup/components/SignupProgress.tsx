// // app/(auth)/signup/components/SignupProgress.tsx
// import { SignupStep } from '@/types/signup.types';

// interface SignupProgressProps {
//     currentStep: SignupStep;
// }

// export const SignupProgress = ({ currentStep }: SignupProgressProps) => {
//     const steps: { key: SignupStep; label: string }[] = [
//         { key: 'basic-info', label: 'Basic Info' },
//         { key: 'profile-picture', label: 'Profile Picture' },
//         { key: 'account-info', label: 'Account Info' },
//         { key: 'kids-info', label: 'Kids Info' },
//         { key: 'verification', label: 'Verification' }
//     ];

//     return (
//         <ul className="steps steps-vertical w-full font-raleway">
//             {steps.map((step) => (
//                 <li 
//                     key={step.key} 
//                     className={`step ${
//                         currentStep === step.key || 
//                         steps.findIndex(s => s.key === currentStep) > 
//                         steps.findIndex(s => s.key === step.key) 
//                             ? 'step-secondary' 
//                             : ''
//                     }`}
//                 >
//                     {step.label}
//                 </li>
//             ))}
//         </ul>
//     );
// };