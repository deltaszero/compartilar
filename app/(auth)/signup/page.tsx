// /home/dusoudeth/Documentos/github/compartilar/app/(auth)/signup/page.tsx
/* eslint-disable react/jsx-no-comment-textnodes */
'use client';
import Image from 'next/image';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createUserWithEmailAndPassword, updateProfile, deleteUser, User } from 'firebase/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, uploadBytes, getDownloadURL, FirebaseStorage, deleteObject } from 'firebase/storage';
import { SignupFormData, SignupStep, KidInfo } from '@/types/signup.types';
import { auth, db, storage } from '@/app/lib/firebaseConfig';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import LoginHeader from "@components/layout/LoginHeader";

interface SignupStore {
    formData: SignupFormData;
    currentStep: SignupStep;
    updateFormData: (data: Partial<SignupFormData>) => void;
    addKid: (kid: KidInfo) => void;
    removeKid: (kidId: string) => void;
    submitForm: () => Promise<void>;
    setCurrentStep: (step: SignupStep) => void;
    validateCurrentStep: () => boolean;
}

const stepsOrder = Object.values(SignupStep);

const useSignupStore = create<SignupStore>()(
    persist(
        (set, get) => ({
            formData: {
                email: '',
                password: '',
                confirmPassword: '',
                username: '',
                uid: '',
                photoURL: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                birthDate: '',
                kids: {},
            },
            currentStep: SignupStep.BASIC_INFO,
            updateFormData: (data) => set((state) => ({ 
                formData: { ...state.formData, ...data } 
            })),
            addKid: (kid) => set((state) => ({
                formData: { 
                    ...state.formData, 
                    kids: { ...state.formData.kids, [kid.id]: kid } 
                }
            })),
            removeKid: (kidId) => set((state) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [kidId]: _, ...remainingKids } = state.formData.kids;
                return { formData: { ...state.formData, kids: remainingKids } };
            }),
            submitForm: async () => {
                const { formData } = get();
                let user: User | null = null;
                let photoURL = formData.photoURL;
                
                try {
                    // Validate username format
                    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
                    if (!usernameRegex.test(formData.username)) {
                        throw new Error('Invalid username format');
                    }
            
                    // Create Firebase auth user
                    const userCredential = await createUserWithEmailAndPassword(
                        auth, 
                        formData.email, 
                        formData.password
                    );
                    user = userCredential.user;
            
                    // Force token refresh to ensure valid credentials for subsequent operations
                    await user.getIdToken(true);
            
                    // Handle profile photo upload directly to permanent location
                    if (photoURL.startsWith('data:image')) {
                        const storageRef = ref(storage, `profile_photos/${user.uid}/profile.jpg`);
                        const blob = await fetch(photoURL).then(r => r.blob());
                        await uploadBytes(storageRef, blob);
                        photoURL = await getDownloadURL(storageRef);
                    }
            
                    // Update user profile
                    await updateProfile(user, {
                        displayName: formData.username,
                        photoURL: photoURL
                    });
            
                    // Prepare atomic batched writes
                    const batch = writeBatch(db);
                    
                    // Reserve username
                    const usernameRef = doc(db, 'usernames', formData.username);
                    batch.set(usernameRef, {
                        uid: user.uid,
                        createdAt: new Date()
                    });
                        
                    // Create account info
                    const accountInfoRef = doc(db, 'account_info', user.uid);
                    batch.set(accountInfoRef, {
                        ...formData,
                        uid: user.uid,
                        photoURL: photoURL,
                        kids: Object.keys(formData.kids),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
            
                    // Create children documents
                    Object.entries(formData.kids).forEach(([kidId, kid]) => {
                        const childRef = doc(db, 'children', kidId);
                        batch.set(childRef, {
                            ...kid,
                            parentId: user!.uid,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    });
            
                    // Commit all writes atomically
                    await batch.commit();
            
                    // Clear persisted data
                    localStorage.removeItem('signup-store');
                    window.location.href = `/${formData.username}`;
                } catch (error) {
                    console.error('Signup error:', error);
                    // Cleanup created resources on failure
                    try {              
                        // Cleanup any successfully created Firestore documents
                        if (user?.uid) {
                            const batch = writeBatch(db);
                            batch.delete(doc(db, 'usernames', formData.username));
                            batch.delete(doc(db, 'account_info', user.uid));
                            Object.keys(formData.kids).forEach(kidId => 
                                batch.delete(doc(db, 'children', kidId))
                            );
                            await batch.commit();
                        }
                        
                    } catch (cleanupError) {
                        console.error('Cleanup error:', cleanupError);
                    }
                    try {
                        if (user) {
                            const photoRef = ref(storage, `profile_photos/${user.uid}/profile.jpg`);
                            await deleteObject(photoRef);
                        }
                        
                    } catch (deleteError) {
                        console.error('Photo cleanup error:', deleteError);
                    }
            
                    // Handle specific error cases
                    const err = error as FirebaseError;
                    if (err.code === 'auth/email-already-in-use') {
                        throw new Error('This email is already registered');
                    }
                    if (err.code === 'permission-denied') {
                        throw new Error('Username is already taken');
                    }
                    throw new Error('Registration failed. Please try again');
                }
            },
            setCurrentStep: (step) => set({ currentStep: step }),
            validateCurrentStep: () => {
                const { formData, currentStep } = get();
                switch(currentStep) {
                    case SignupStep.BASIC_INFO:
                        return !!formData.email && !!formData.password && 
                               formData.password === formData.confirmPassword;
                    case SignupStep.PROFILE_PICTURE:
                        return !!formData.photoURL;
                    case SignupStep.ACCOUNT_INFO:
                        return !!formData.firstName && !!formData.lastName;
                    default:
                        return true;
                }
            }
        }),
        {
            name: 'signup-store',
            partialize: (state) => ({
                formData: {
                    ...state.formData,
                    // Don't persist data URLs to prevent storage bloat
                    photoURL: state.formData.photoURL.startsWith('data:image') 
                        ? '' 
                        : state.formData.photoURL
                },
                currentStep: state.currentStep
            }),
        }
    )
);

export default function SignupPage() {
    const [hasHydrated, setHasHydrated] = useState(false);
    const { 
        formData,
        currentStep,
        updateFormData,
        addKid,
        removeKid,
        submitForm,
        setCurrentStep,
        validateCurrentStep
    } = useSignupStore();

    // Add hydration effect
    useEffect(() => {
        setHasHydrated(true);
    }, []);
    
    const currentStepIndex = stepsOrder.indexOf(currentStep);

    const handleStepNavigation = async (direction: 'next' | 'prev') => {
        if (direction === 'next' && !validateCurrentStep()) return;
        
        const newIndex = direction === 'next' 
            ? Math.min(currentStepIndex + 1, stepsOrder.length - 1)
            : Math.max(currentStepIndex - 1, 0);

        setCurrentStep(stepsOrder[newIndex]);
    };

    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep !== SignupStep.VERIFICATION) return;
        try {
            setSubmissionError(null);
            await submitForm();
        } catch (error) {
            console.error('Submission error:', error);
            if (error instanceof Error) {
                setSubmissionError(
                    error.message || 'An error occurred during registration. Please try again.'
                );
            } else {
                setSubmissionError('An error occurred during registration. Please try again.');
            }
            // Reset to account info step on validation errors
            if (error instanceof Error && error.message.includes('email')) {
                setCurrentStep(SignupStep.BASIC_INFO);
            }
        }
    };
    const stepName = {
        'basic-info': 'Nova Conta',
        'profile-picture': 'Avatar',
        'account-info': 'Informações',
        'kids-info': 'Filhos',
        'verification': 'Verificação'
    }
    return (
        <div className="w-full flex flex-col items-center justify-center align-start">
            <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-lg px-6 py-3 space-y-4">
                <div className="text-primary">
                    <LoginHeader />
                    <h1 className="flex flex-row justify-start text-2xl font-nunito font-bold uppercase">
                        Cadastro
                    </h1> 
                </div>
                <div className="flex flex-col md:flex-row md:space-x-12">
                    <div className="hidden md:flex md:flex-col w-1/4">
                        <ul className="steps steps-vertical">
                            {stepsOrder.map((step, index) => (
                                <div 
                                    key={step}
                                    className={`step ${index < currentStepIndex + 1 ? 'step-primary' : ''}`}
                                    data-content={index < currentStepIndex + 1 ? '' : ''}
                                >
                                    <span className={`hidden md:inline font-bold font-nunito ${index <= currentStepIndex ? 'text-primary' : 'text-neutral-content'}`}>
                                        {/* {step.replace('-', ' ').toUpperCase()} */}
                                        {stepName[step]}
                                    </span>
                                </div>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full md:w-3/4">
                        {/* Mobile Progress Indicator */}
                        <div className="md:hidden mb-6 text-md font-bold text-center text-gray-500 font-nunito">
                            {/* Step {currentStepIndex + 1} of {stepsOrder.length}: {stepsOrder[currentStepIndex].replace('-', ' ').toUpperCase()} */}
                            {stepName[stepsOrder[currentStepIndex]]}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* BASIC INFO STEP */}
                            {currentStep === SignupStep.BASIC_INFO && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Esse e-mail será utilizado no login
                                        </p>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={(e) => updateFormData({ email: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Escolha um nome de usuário sem espaços
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={formData.username}
                                            onChange={(e) => updateFormData({ username: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            pattern="^[a-zA-Z0-9_-]{3,20}$"
                                            title="Username must be 3-20 characters (letters, numbers, underscores, hyphens)"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Escolha uma senha segura, com no mínimo 6 caracteres
                                        </p>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={(e) => updateFormData({ password: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Digite a mesma senha escolhida acima
                                        </p>
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            {/* PROFILE PICTURE STEP */}
                            {currentStep === SignupStep.PROFILE_PICTURE && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Escolha uma imagem de perfil 😊 Essa imagem será visível apenas pela sua rede de apoio na área logada do site
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        updateFormData({ 
                                                            photoURL: reader.result as string 
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="file-input file-input-bordered file-input-primary w-full"
                                            required
                                        />
                                    </div>
                                    {formData.photoURL && (
                                        <div className="relative group">
                                            <Image 
                                                src={formData.photoURL} 
                                                alt="Profile preview" 
                                                className="w-48 h-48 rounded-full object-cover shadow-lg"
                                                width={48}
                                                height={48}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-sm">Change Photo</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* ACCOUNT INFO STEP */}
                            {currentStep === SignupStep.ACCOUNT_INFO && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Primeiro nome
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData({ firstName: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Último nome
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData({ lastName: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Data de nascimento
                                        </p>
                                        <input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => updateFormData({ birthDate: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Número de telefone ☎️ Sem espaços
                                        </p>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={formData.phoneNumber}
                                            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                                            className="input input-bordered input-sm md:input-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* KIDS INFO STEP */}
                            {currentStep === SignupStep.KIDS_INFO && (
                                <div className="flex flex-col space-y-4 items-center">
                                        <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                            Essa etapa é opcional, então se preferir você pode deixar pra depois 😊
                                        </p>
                                    {Object.values(formData.kids).map((kid) => (
                                        <div key={kid.id} className="card p-4 shadow">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                                        Primeiro nome
                                                    </p>
                                                    <input
                                                        type="text"
                                                        placeholder="First Name"
                                                        value={kid.firstName}
                                                        onChange={(e) => addKid({ ...kid, firstName: e.target.value })}
                                                        className="input input-bordered input-sm md:input-md"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                                        Último nome
                                                    </p>
                                                    <input
                                                        type="text"
                                                        placeholder="Last Name"
                                                        value={kid.lastName}
                                                        onChange={(e) => addKid({ ...kid, lastName: e.target.value })}
                                                        className="input input-bordered input-sm md:input-md"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                                        Data de nascimento
                                                    </p>
                                                    <input
                                                        type="date"
                                                        value={kid.birthDate}
                                                        onChange={(e) => addKid({ ...kid, birthDate: e.target.value })}
                                                        className="input input-bordered input-sm md:input-md"
                                                    />
                                                </div>
                                                {/* <div className="flex flex-col">
                                                    <p className="pl-1 text-sm font-light text-gray-500 font-nunito">
                                                        Gênero
                                                    </p>
                                                    <select
                                                        value={kid.gender || ''}
                                                        onChange={(e) => addKid({ 
                                                            ...kid, 
                                                            gender: e.target.value as KidInfo['gender'] 
                                                        })}
                                                        className="select select-bordered"
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="male">Masculino</option>
                                                        <option value="female">Feminino</option>
                                                        <option value="other">Outro</option>
                                                    </select>
                                                </div> */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeKid(kid.id)}
                                                    className="btn btn-ghost max-w-xs text-red-500 font-bold btn-sm md:btn-md"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addKid({
                                            id: Date.now().toString(),
                                            firstName: '',
                                            lastName: '',
                                            birthDate: '',
                                            gender: null,
                                            relationship: null
                                        })}
                                        className="btn btn-ghost max-w-xs text-primary font-bold"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            )}

                            {/* VERIFICATION STEP */}
                            {currentStep === SignupStep.VERIFICATION && (
                                <div className="card bg-base-100 p-4 shadow">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold">Review Your Information</h2>
                                        <div className="space-y-2">
                                            <p><strong>Email:</strong> {formData.email}</p>
                                            <p><strong>Username:</strong> {formData.username}</p>
                                            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                                            <p><strong>Phone:</strong> {formData.phoneNumber}</p>
                                            <p><strong>Birth Date:</strong> {formData.birthDate}</p>
                                            <div>
                                                <strong>Children:</strong>
                                                {Object.values(formData.kids).map((kid) => (
                                                    <div key={kid.id} className="ml-4">
                                                        {kid.firstName} {kid.lastName} ({kid.birthDate})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NAVIGATION CONTROLS */}
                            {hasHydrated && ( // Add conditional rendering
                                <div className="flex justify-between">
                                    {currentStepIndex > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleStepNavigation('prev')}
                                            className="btn btn-ghost"
                                        >
                                            ← Voltar
                                        </button>
                                    )}
                                    
                                    {currentStepIndex < stepsOrder.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => handleStepNavigation('next')}
                                            className="btn btn-primary ml-auto text-primary-content"
                                            disabled={!validateCurrentStep()}
                                        >
                                            Avançar →
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            className="btn btn-success ml-auto"
                                        >
                                            Complete Registration
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ERROR DISPLAY */}
                            {submissionError && (
                                <div className="alert alert-error mt-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{submissionError}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}