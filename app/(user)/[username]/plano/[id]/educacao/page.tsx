'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getParentalPlan, updatePlanField, approveField } from '../../services/plan-service';
import { ParentalPlan } from '../../types';
import { FormLayout } from '../../components/forms';
import { educationFormData } from './data';
import { useUser } from '@/context/userContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import PlanChangeLog from '../../components/PlanChangeLog';

const EducacaoPage = () => {
  const { id } = useParams();
  const { user, userData } = useUser();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<ParentalPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [pendingFields, setPendingFields] = useState<{
    fieldName: string;
    dbFieldName: string;
    label: string;
    currentValue: any;
    previousValue: any;
    updatedBy: string;
    updatedByName: string;
    updatedAt: number;
  }[]>([]);
  const [approvingField, setApprovingField] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        if (id && typeof id === 'string') {
          const planData = await getParentalPlan(id);
          if (planData) {
            setPlan(planData);
            
            // Check if the education section exists and has pending changes
            const educationSection = planData.sections.education;
            let hasPending = false;
            
            if (educationSection) {
              const initialState: Record<string, any> = {};
              
              Object.entries(educationSection).forEach(([key, value]) => {
                if (value && typeof value === 'object' && 'value' in value) {
                  initialState[key] = value.value;
                  if (value.status === 'pending') {
                    hasPending = true;
                  }
                } else {
                  initialState[key] = value;
                }
              });
              
              setFormState(initialState);
              setHasPendingChanges(hasPending);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        setGlobalError('Erro ao carregar o plano. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, [id, userData]);

  // Handle form field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormState(prevState => ({
      ...prevState,
      [fieldId]: value
    }));
    
    if (errors[fieldId]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.uid || !plan?.id) {
      setGlobalError('Erro de autenticação ou plano inválido.');
      return;
    }
    
    setSubmitting(true);
    setGlobalError('');
    
    try {
      const validFieldPromises = [];
      const originalValues: Record<string, any> = {};
      
      if (plan.sections.education) {
        Object.entries(plan.sections.education).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'value' in value) {
            originalValues[key] = value.value;
          } else {
            originalValues[key] = value;
          }
        });
      }
      
      for (const [fieldId, value] of Object.entries(formState)) {
        if (originalValues[fieldId] !== value) {
          validFieldPromises.push(
            updatePlanField(
              plan.id,
              'education',
              fieldId,
              value,
              user.uid
            )
          );
        }
      }
      
      await Promise.all(validFieldPromises);
      
      toast({
        title: 'Alterações enviadas para aprovação',
        description: 'As alterações foram salvas e enviadas para aprovação dos outros editores do plano.',
        variant: 'default'
      });
      
      const updatedPlan = await getParentalPlan(plan.id);
      if (updatedPlan) {
        setPlan(updatedPlan);
        setHasPendingChanges(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setGlobalError('Erro ao salvar as alterações. Por favor, tente novamente.');
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as alterações.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!plan) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Plano não encontrado</h1>
        <p>O plano solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
      </div>
    );
  }
  
  const isUserEditor = plan.editors.includes(user?.uid || '');
  
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Educação Regular</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Nessa seção você definirá os aspectos relacionados à educação da criança, 
          incluindo escola, materiais, atividades extras e responsabilidades.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <FormLayout
          sections={[educationFormData]}
          formState={formState}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          errors={errors}
          submitLabel="Salvar e enviar para aprovação"
          isSubmitting={submitting}
          globalError={globalError}
          isDisabled={!isUserEditor}
          pendingApproval={hasPendingChanges}
        />
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Histórico de Alterações</h2>
          {plan && <PlanChangeLog planId={plan.id} limit={10} />}
        </div>
      </div>
    </div>
  );
};

export default EducacaoPage;
