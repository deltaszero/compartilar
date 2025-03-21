'use client';

import { useState, use } from 'react';
import { usePlan } from '../../context';
import { EducationSection } from '../../../types';
import { updateEducationSection } from '../../../services/plan-service';
import { useUser } from '@/context/userContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RegularEducationForm from '../../../components/RegularEducationForm';
import { regularEducationInitialValues } from '../../../data/regularEducationFormData';

export default function EditEducationPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error, refreshPlan } = usePlan();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Erro</h1>
        <p className="text-center text-gray-500">{error || 'Plano não encontrado'}</p>
      </div>
    );
  }

  const educationData = plan.sections.education || regularEducationInitialValues;

  const handleFormSubmit = async (data: EducationSection) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await updateEducationSection(resolvedParams.id, user.uid, data);
      await refreshPlan();
      router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/educacao`);
    } catch (error) {
      console.error('Error updating education section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/educacao`);
  };

  return (
    <div className="p-8">
      <Button 
        variant="default" 
        className="mb-4"
        onClick={handleCancel}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">Editar - Educação Regular</h1>
      
      <RegularEducationForm 
        initialData={educationData}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}