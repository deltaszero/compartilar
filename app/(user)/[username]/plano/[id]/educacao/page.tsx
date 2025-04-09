'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getParentalPlan, updatePlanField, approveField } from '../../services/plan-service';
import { ParentalPlan, EducationSection } from '../../types';
import { FormLayout } from '../../components/forms';
import { educationFormData } from './data';
import { useUser } from '@/context/userContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import PlanChangeLog from '../../components/PlanChangeLog';
import { getAuth } from 'firebase/auth';

// Helper function to normalize values for comparison
const normalizeValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

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
            const educationSection = planData.sections?.education;
            let hasPending = false;
            let pendingFieldsList: any[] = [];
            
            if (educationSection) {
              const initialState: Record<string, any> = {};
              
              Object.entries(educationSection).forEach(([key, value]) => {
                if (value && typeof value === 'object' && 'value' in value) {
                  // Extract the value for the form state
                  initialState[key] = value.value;
                  
                  // Check if this field has pending changes
                  if (value.status === 'pending') {
                    hasPending = true;
                    
                    // Add to pending fields list for display
                    pendingFieldsList.push({
                      fieldName: key,
                      dbFieldName: key,
                      label: key, // We'll display raw field name as fallback
                      currentValue: value.value,
                      previousValue: value.previousValue,
                      updatedBy: value.lastUpdatedBy,
                      updatedByName: value.lastUpdatedBy, // Would need to resolve to actual name
                      updatedAt: value.lastUpdatedAt
                    });
                  }
                } else {
                  initialState[key] = value;
                }
              });
              
              console.log('Form state initialized:', initialState);
              console.log('Pending fields:', pendingFieldsList);
              
              setFormState(initialState);
              setHasPendingChanges(hasPending);
              setPendingFields(pendingFieldsList);
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
      
      if (plan.sections?.education) {
        Object.entries(plan.sections?.education).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'value' in value) {
            originalValues[key] = value.value;
          } else {
            originalValues[key] = value;
          }
        });
      }
      
      for (const [fieldId, value] of Object.entries(formState)) {
        // Skip undefined values
        if (value === undefined) continue;
        
        // Use the normalize helper for consistent value handling
        const normalizedValue = normalizeValue(value);
        const normalizedOriginal = normalizeValue(originalValues[fieldId]);
        
        // Log all values to help diagnose
        console.log(`Field: ${fieldId}, Current: "${normalizedValue}", Original: "${normalizedOriginal}"`);
        
        // If field has changed or doesn't exist in originalValues
        if (normalizedValue !== normalizedOriginal || !(fieldId in originalValues)) {
          console.log(`Updating field ${fieldId}: "${normalizedOriginal}" → "${normalizedValue}"`);
          
          try {
            validFieldPromises.push(
              updatePlanField(
                plan.id,
                'education',
                fieldId,
                normalizedValue,
                user.uid
              )
            );
          } catch (err) {
            console.error(`Error updating field ${fieldId}:`, err);
          }
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
        {/* Pending changes display */}
        {hasPendingChanges && pendingFields.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
            <h2 className="text-lg font-semibold mb-2">Alterações Pendentes</h2>
            <div className="space-y-3">
              {pendingFields.map((field, index) => (
                <div key={index} className="p-3 bg-white rounded shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <div className="grid grid-cols-2 gap-4 mt-1 text-sm">
                        <div>
                          <p className="text-gray-500">Valor anterior:</p>
                          <p>{field.previousValue || '(vazio)'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Novo valor:</p>
                          <p>{field.currentValue || '(vazio)'}</p>
                        </div>
                      </div>
                    </div>
                    {isUserEditor && (
                      <div className="space-x-2">
                        {user?.uid === field.updatedBy ? (
                          // If this is the user's own change, show cancel button
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={async () => {
                              try {
                                setApprovingField(field.dbFieldName);
                                // Simple client-side direct update approach to cancel changes
                                // This approach sets the field value directly back to the previous value
                                
                                // Get the current field with previous value reference
                                if (!plan?.sections?.education?.[field.dbFieldName as string]) {
                                  throw new Error('Field not found');
                                }
                                
                                const currentField = plan.sections?.education?.[field.dbFieldName as string] as any;
                                
                                // Check if this is the user's own change
                                if (currentField.lastUpdatedBy !== user!.uid) {
                                  throw new Error('You can only cancel your own changes');
                                }
                                
                                // Get the previous value to restore
                                const previousValue = currentField.previousValue || '';
                                
                                // Update the field directly with the original value
                                await updatePlanField(
                                  plan!.id,
                                  'education',
                                  field.dbFieldName,
                                  previousValue,
                                  user!.uid
                                );
                                
                                toast({
                                  title: 'Alteração cancelada',
                                  description: 'Sua alteração foi cancelada com sucesso.',
                                  variant: 'default'
                                });
                                
                                // Refresh the plan data
                                const updatedPlan = await getParentalPlan(plan!.id);
                                if (updatedPlan) {
                                  setPlan(updatedPlan);
                                  setHasPendingChanges(false);
                                  setPendingFields([]);
                                }
                              } catch (error) {
                                console.error('Error canceling field change:', error);
                                toast({
                                  title: 'Erro',
                                  description: 'Ocorreu um erro ao cancelar a alteração.',
                                  variant: 'destructive'
                                });
                              } finally {
                                setApprovingField(null);
                              }
                            }}
                            disabled={approvingField === field.dbFieldName}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          // If this is another user's change, show approve/reject buttons
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={async () => {
                                try {
                                  setApprovingField(field.dbFieldName);
                                  await approveField(plan!.id, 'education', field.dbFieldName, true, user!.uid);
                                  
                                  toast({
                                    title: 'Alteração aprovada',
                                    description: 'A alteração foi aprovada com sucesso.',
                                    variant: 'default'
                                  });
                                  
                                  // Refresh the plan data
                                  const updatedPlan = await getParentalPlan(plan!.id);
                                  if (updatedPlan) {
                                    setPlan(updatedPlan);
                                    setHasPendingChanges(false);
                                    setPendingFields([]);
                                  }
                                } catch (error) {
                                  console.error('Error approving field:', error);
                                  toast({
                                    title: 'Erro',
                                    description: 'Ocorreu um erro ao aprovar a alteração.',
                                    variant: 'destructive'
                                  });
                                } finally {
                                  setApprovingField(null);
                                }
                              }}
                              disabled={approvingField === field.dbFieldName}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={async () => {
                                try {
                                  setApprovingField(field.dbFieldName);
                                  await approveField(plan!.id, 'education', field.dbFieldName, false, user!.uid);
                                  
                                  toast({
                                    title: 'Alteração rejeitada',
                                    description: 'A alteração foi rejeitada com sucesso.',
                                    variant: 'default'
                                  });
                                  
                                  // Refresh the plan data
                                  const updatedPlan = await getParentalPlan(plan!.id);
                                  if (updatedPlan) {
                                    setPlan(updatedPlan);
                                    setHasPendingChanges(false);
                                    setPendingFields([]);
                                  }
                                } catch (error) {
                                  console.error('Error rejecting field:', error);
                                  toast({
                                    title: 'Erro',
                                    description: 'Ocorreu um erro ao rejeitar a alteração.',
                                    variant: 'destructive'
                                  });
                                } finally {
                                  setApprovingField(null);
                                }
                              }}
                              disabled={approvingField === field.dbFieldName}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
