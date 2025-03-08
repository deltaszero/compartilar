'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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
  const router = useRouter();

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
    <div className="w-full overflow-hidden bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] mb-4">
      <div className="p-4 pb-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Complete seu perfil - {completionPercentage}%</h3>
          {missingFields.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {missingFields.length} {missingFields.length === 1 ? 'campo' : 'campos'} faltante{missingFields.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <Progress value={completionPercentage} className="h-2" />
        
        {missingFields.length > 0 && (
          <div className="mt-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {missingFields.slice(0, 2).join(', ')}
              {missingFields.length > 2 && ` e mais ${missingFields.length - 2}...`}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 p-0 text-xs"
              onClick={navigateToProfile}
            >
              Completar <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCompletion;