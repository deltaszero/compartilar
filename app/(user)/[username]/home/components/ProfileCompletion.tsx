'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import imageFormFilling from '@/app/assets/images/illustration-01-form-filling.webp';

interface ProfileCompletionProps {
    userData: {
        uid?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        photoURL?: string;
        email?: string;
        about?: string;
        gender?: string;
        phoneNumber?: string;
        birthDate?: string;
    } | null;
}

export function ProfileCompletion({ userData }: ProfileCompletionProps) {
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();

    // check for mobile screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    useEffect(() => {
        if (!userData) {
            setCompletionPercentage(0);
            return;
        }

        // Define fields to check for completion
        const fields = [
            { name: 'firstName', label: 'Nome' },
            { name: 'lastName', label: 'Sobrenome' },
            { name: 'email', label: 'Email' },
            { name: 'photoURL', label: 'Foto de perfil' },
            { name: 'about', label: 'Sobre' },
            { name: 'gender', label: 'Gênero' },
            { name: 'phoneNumber', label: 'Telefone' },
            { name: 'birthDate', label: 'Data de nascimento' }
        ];

        // Count completed fields
        const completedFields = fields.filter(field => {
            const value = userData[field.name as keyof typeof userData];
            return value !== undefined && value !== null && value !== '';
        }).length;

        // Calculate percentage
        const percentage = Math.round((completedFields / fields.length) * 100);
        setCompletionPercentage(percentage);

        // Get missing fields
        const missing = fields
            .filter(field => {
                const value = userData[field.name as keyof typeof userData];
                return value === undefined || value === null || value === '';
            })
            .map(field => field.label);

        setMissingFields(missing);
    }, [userData]);

    // If profile is 100% complete, don't show this component
    if (completionPercentage === 100) {
        return null;
    }

    const navigateToProfile = () => {
        if (userData?.username) {
            router.push(`/${userData.username}/perfil`);
        }
    };

    return (
        <div className="w-full overflow-hidden bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] font-nunito">
            <div className="flex flex-col gap-2 p-4 pb-3">
                <div className={`h-full flex flex-row items-center gap-4 mb-2`}>
                    <figure className={`$(isMobile ? 'w-1/2' : 'w-1/4')`}>
                        <Image
                            src={imageFormFilling}
                            alt="Complete seu perfil"
                            className="w-36 h-36"
                        />
                    </figure>
                    <div className="flex flex-col w-1/2 justify-end">
                        {isMobile ? (
                            <h3 className="text-2xl font-black font-raleway">
                                Complete <br /> seu perfil <br /> ({completionPercentage}%)
                            </h3>
                        ) : (
                            <h3 className="text-3xl font-black font-raleway">
                                Complete seu perfil ({completionPercentage}%)
                            </h3>
                        )}
                        {missingFields.length > 0 && (
                            <span className="text-sm sm:text-lg text-gray-400">
                                {missingFields.length} {missingFields.length === 1 ? 'campo' : 'campos'} faltante{missingFields.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                <Progress value={completionPercentage} className="h-4" />

                {missingFields.length > 0 && (
                    <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-400">
                            {missingFields.slice(0, 2).join(', ')}
                            {missingFields.length > 2 && ` e mais ${missingFields.length - 2}...`}
                        </div>

                        <Button
                            variant="default"
                            className="px-4 text-md font-semibold font-raleway"
                            onClick={navigateToProfile}
                        >
                            Completar <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileCompletion;