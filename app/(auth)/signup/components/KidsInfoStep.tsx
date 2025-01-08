// app/(auth)/signup/components/KidsInfoStep.tsx
import React, { useState } from 'react';
import { useSignupForm } from '../hooks/useSignupForm';
import { KidInfo } from '@/types/signup.types';

export const KidsInfoStep: React.FC = () => {
    const { formData, addKid, removeKid, setCurrentStep } = useSignupForm();
    const [newKid, setNewKid] = useState<KidInfo>({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: undefined,
        relationship: undefined
    });

    const handleAddKid = () => {
        if (newKid.firstName && newKid.lastName && newKid.birthDate) {
            addKid(newKid);
            setNewKid({
                firstName: '',
                lastName: '',
                birthDate: '',
                gender: undefined,
                relationship: undefined
            });
        }
    };

    const handleNextStep = () => {
        setCurrentStep('verification');
    };

    const handlePreviousStep = () => {
        setCurrentStep('account-info');
    };

    return (
        <div className="space-y-4 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-center">Kids Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="First Name"
                    value={newKid.firstName}
                    onChange={(e) => setNewKid({...newKid, firstName: e.target.value})}
                    className="input input-bordered w-full"
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={newKid.lastName}
                    onChange={(e) => setNewKid({...newKid, lastName: e.target.value})}
                    className="input input-bordered w-full"
                />
                <input
                    type="date"
                    value={newKid.birthDate}
                    onChange={(e) => setNewKid({...newKid, birthDate: e.target.value})}
                    className="input input-bordered w-full"
                />
                <select
                    value={newKid.gender || ''}
                    onChange={(e) => setNewKid({...newKid, gender: e.target.value as KidInfo['gender']})}
                    className="select select-bordered w-full"
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <button 
                onClick={handleAddKid}
                className="btn btn-primary w-full"
                disabled={!newKid.firstName || !newKid.lastName || !newKid.birthDate}
            >
                Add Kid
            </button>

            {formData.kids && formData.kids.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xl font-semibold mb-2">Added Kids</h3>
                    <ul className="list-disc pl-5">
                        {formData.kids.map((kid, index) => (
                            <li key={index} className="flex justify-between items-center">
                                {kid.firstName} {kid.lastName}
                                <button 
                                    onClick={() => removeKid(index)}
                                    className="btn btn-error btn-xs"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-between mt-4">
                <button 
                    onClick={handlePreviousStep} 
                    className="btn btn-ghost"
                >
                    Back
                </button>
                <button 
                    onClick={handleNextStep} 
                    className="btn btn-primary"
                    disabled={!formData.kids || formData.kids.length === 0}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
