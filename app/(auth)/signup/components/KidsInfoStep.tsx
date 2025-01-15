// app/(auth)/signup/components/KidsInfoStep.tsx
import React, { useState } from 'react';
import { useSignupForm } from '../hooks/useSignupForm';
import { KidInfo } from '@/types/signup.types';

export const KidsInfoStep: React.FC = () => {
    const { formData, addKid, removeKid } = useSignupForm();
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

    const calculateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        if (months < 0) {
            years -= 1;
            months += 12;
        }
        const yearString = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "";
        const monthString = months > 0 ? `${months} mes${months > 1 ? "es" : ""}` : "";
        return [yearString, monthString].filter(Boolean).join(" e ");
    }

    return (
        <div className="space-y-4">
            <div className="divider">
                <p className="text-xs text-gray-500">
                    Aqui você adiciona filhos e filhas, mas se quiser pode deixar pra depois
                </p>
            </div>
            
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
            <div className="flex justify-center">
                <button 
                    onClick={handleAddKid}
                    className="btn btn-primary w-1/4"
                    disabled={!newKid.firstName || !newKid.lastName || !newKid.birthDate}
                >
                    Adicionar
                </button>
            </div>
            {formData.kids && formData.kids.length > 0 && (
                <div className="mt-4 pt-4">
                    <p className="my-2 font-semibold">
                        Seus amoresss 💕
                    </p>
                    <ul className="list-disc pl-5">
                        {formData.kids.map((kid, index) => (
                            <li key={index} className="flex justify-between items-center my-2">
                                {kid.firstName} {kid.lastName}, {calculateAge(kid.birthDate)}
                                <button 
                                    onClick={() => removeKid(index)}
                                    className="btn btn-secondary btn-xs"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
