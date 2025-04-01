'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getParentalPlan, updatePlanField, approveField } from '../../services/plan-service';
import { ParentalPlan } from '../../types';
import { FormLayout } from '../../components/forms';
import { generalFormData } from './data';
import { useUser } from '@/context/userContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import PlanChangeLog from '../../components/PlanChangeLog';

const GuardaPage = () => {
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
  const [editors, setEditors] = useState<{id: string, name: string}[]>([]);
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
            
            // Check if the general section exists and has pending changes
            const generalSection = planData.sections.general;
            let hasPending = false;
            
            if (generalSection) {
              // Initialize form state from plan data
              const initialState: Record<string, any> = {};
              
              // Map the general section data to form state
              Object.entries(generalSection).forEach(([key, value]) => {
                // If the value is a FieldStatus object with status
                if (value && typeof value === 'object' && 'value' in value) {
                  initialState[mapToFormFieldId(key)] = value.value;
                  
                  // Check if any field has pending status
                  if (value.status === 'pending') {
                    hasPending = true;
                  }
                } else {
                  initialState[mapToFormFieldId(key)] = value;
                }
              });
              
              setFormState(initialState);
              setHasPendingChanges(hasPending);
            }

            // Fetch editors' information from the API
            try {
              const editorsList = [];
              
              // Add current user
              if (userData) {
                editorsList.push({
                  id: userData.uid,
                  name: userData.firstName && userData.lastName 
                    ? `${userData.firstName} ${userData.lastName}` 
                    : userData.username || userData.displayName || 'Você'
                });
              }

              // Fetch other editors' information from the API
              const fetchEditorsPromises = planData.editors
                .filter(editorId => userData && editorId !== userData.uid)
                .map(async (editorId) => {
                  try {
                    const response = await fetch(`/api/users/${editorId}`);
                    
                    if (response.ok) {
                      const userData = await response.json();
                      
                      return {
                        id: editorId,
                        name: userData.displayName || userData.firstName && userData.lastName
                          ? `${userData.firstName} ${userData.lastName}`
                          : userData.username || userData.email || 'Usuário'
                      };
                    }
                    
                    return {
                      id: editorId,
                      name: `Editor ${editorId.substring(0, 4)}`
                    };
                  } catch (error) {
                    console.error(`Error fetching editor ${editorId}:`, error);
                    return {
                      id: editorId,
                      name: `Editor ${editorId.substring(0, 4)}`
                    };
                  }
                });
                
              // Wait for all editor information to be fetched
              const fetchedEditors = await Promise.all(fetchEditorsPromises);
              setEditors([...editorsList, ...fetchedEditors]);
            } catch (error) {
              console.error('Error fetching editors:', error);
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
  
  // Update pending fields when editors are loaded
  useEffect(() => {
    if (!plan || !plan.sections.general || !editors.length) return;
    
    const generalSection = plan.sections.general;
    const pendingFieldsData: any[] = [];
    
    // Find fields with pending changes
    Object.entries(generalSection).forEach(([key, value]) => {
      // If the value is a FieldStatus object with pending status
      if (value && typeof value === 'object' && 'value' in value && value.status === 'pending') {
        // If the current user didn't make this change, add it to pending fields
        if (value.lastUpdatedBy !== user?.uid) {
          // Get form field ID for display purposes
          const formFieldId = mapToFormFieldId(key);
          
          // Find the field definition to get the label
          let fieldLabel = key; // Default to key if definition not found
          
          // Try to find field definition in generalFormData
          if (formFieldId === 'referenceHome') {
            fieldLabel = 'Lar Referência';
          } else if (formFieldId === 'guardianshipType') {
            fieldLabel = 'Tipo de Guarda';
          } else if (formFieldId.includes('childSupport.employed') || formFieldId.includes('childSupportEmployed')) {
            // Get specific field label for employed parent
            if (formFieldId.includes('moneyPayment')) {
              fieldLabel = 'Pagamento em Dinheiro (Genitor Empregado)';
            } else if (formFieldId.includes('paymentMethod')) {
              fieldLabel = 'Método de Pagamento (Genitor Empregado)';
            } else if (formFieldId.includes('directPayment')) {
              fieldLabel = 'Pagamento direto de obrigações (Genitor Empregado)';
            } else if (formFieldId.includes('services')) {
              fieldLabel = 'Custeio dos serviços (Genitor Empregado)';
            } else if (formFieldId.includes('extraExpenses')) {
              fieldLabel = 'Reembolso de despesas extras (Genitor Empregado)';
            } else {
              fieldLabel = 'Pensão Alimentícia (Genitor Empregado)';
            }
          } else if (formFieldId.includes('childSupport.unemployed') || formFieldId.includes('childSupportUnemployed')) {
            // Get specific field label for unemployed parent
            if (formFieldId.includes('moneyPayment')) {
              fieldLabel = 'Pagamento em Dinheiro (Genitor Desempregado)';
            } else if (formFieldId.includes('paymentMethod')) {
              fieldLabel = 'Método de Pagamento (Genitor Desempregado)';
            } else if (formFieldId.includes('directPayment')) {
              fieldLabel = 'Pagamento direto de obrigações (Genitor Desempregado)';
            } else if (formFieldId.includes('services')) {
              fieldLabel = 'Custeio dos serviços (Genitor Desempregado)';
            } else if (formFieldId.includes('extraExpenses')) {
              fieldLabel = 'Reembolso de despesas extras (Genitor Desempregado)';
            } else {
              fieldLabel = 'Pensão Alimentícia (Genitor Desempregado)';
            }
          }
          
          // Get editor name for who updated
          const editorInfo = editors.find(e => e.id === value.lastUpdatedBy);
          const editorName = editorInfo?.name || 'Outro usuário';
          
          // Add to pending fields for approval
          pendingFieldsData.push({
            fieldName: formFieldId,
            dbFieldName: key,
            label: fieldLabel,
            currentValue: value.value,
            previousValue: value.previousValue,
            updatedBy: value.lastUpdatedBy,
            updatedByName: editorName,
            updatedAt: value.lastUpdatedAt
          });
        }
      }
    });
    
    // Update state with pending fields
    setPendingFields(pendingFieldsData);
  }, [plan, editors, user]);
  
  // Helper function to map database field names to form field IDs
  const mapToFormFieldId = (dbFieldName: string): string => {
    const mappings: Record<string, string> = {
      'reference_home': 'referenceHome',
      'guardianship_type': 'guardianshipType',
      // Employed parent fields - map to new structure
      'employed_money_payment': 'childSupportEmployed.moneyPayment',
      'employed_payment_method': 'childSupportEmployed.paymentMethod',
      'employed_direct_payment': 'childSupportEmployed.directPayment',
      'employed_services_payment': 'childSupportEmployed.services',
      'employed_extra_expenses': 'childSupportEmployed.extraExpenses',
      // Unemployed parent fields - map to new structure
      'unemployed_money_payment': 'childSupportUnemployed.moneyPayment',
      'unemployed_payment_method': 'childSupportUnemployed.paymentMethod',
      'unemployed_direct_payment': 'childSupportUnemployed.directPayment',
      'unemployed_services_payment': 'childSupportUnemployed.services',
      'unemployed_extra_expenses': 'childSupportUnemployed.extraExpenses'
    };
    
    return mappings[dbFieldName] || dbFieldName;
  };
  
  // Helper function to map form field IDs to database field names
  const mapToDatabaseFieldName = (formFieldId: string): string => {
    // Map both old and new field structures
    if (formFieldId.startsWith('childSupport.employed') || formFieldId.includes('childSupportEmployed')) {
      if (formFieldId === 'childSupport.employed.moneyPayment' || 
          formFieldId === 'childSupportEmployed.moneyPayment') {
        return 'employed_money_payment';
      } else if (formFieldId === 'childSupport.employed.paymentMethod' || 
                 formFieldId === 'childSupportEmployed.paymentMethod') {
        return 'employed_payment_method';
      } else if (formFieldId === 'childSupport.employed.otherObligations.directPayment' || 
                 formFieldId === 'childSupportEmployed.directPayment') {
        return 'employed_direct_payment';
      } else if (formFieldId === 'childSupport.employed.otherObligations.services' || 
                 formFieldId === 'childSupportEmployed.services') {
        return 'employed_services_payment';
      } else if (formFieldId === 'childSupport.employed.otherObligations.extraExpenses' || 
                 formFieldId === 'childSupportEmployed.extraExpenses') {
        return 'employed_extra_expenses';
      }
    } else if (formFieldId.startsWith('childSupport.unemployed') || formFieldId.includes('childSupportUnemployed')) {
      if (formFieldId === 'childSupport.unemployed.moneyPayment' ||
          formFieldId === 'childSupportUnemployed.moneyPayment') {
        return 'unemployed_money_payment';
      } else if (formFieldId === 'childSupport.unemployed.paymentMethod' ||
                 formFieldId === 'childSupportUnemployed.paymentMethod') {
        return 'unemployed_payment_method';
      } else if (formFieldId === 'childSupport.unemployed.otherObligations.directPayment' ||
                 formFieldId === 'childSupportUnemployed.directPayment') {
        return 'unemployed_direct_payment';
      } else if (formFieldId === 'childSupport.unemployed.otherObligations.services' ||
                 formFieldId === 'childSupportUnemployed.services') {
        return 'unemployed_services_payment';
      } else if (formFieldId === 'childSupport.unemployed.otherObligations.extraExpenses' ||
                 formFieldId === 'childSupportUnemployed.extraExpenses') {
        return 'unemployed_extra_expenses';
      }
    }
    
    // Simple mappings for top-level fields
    const mappings: Record<string, string> = {
      'referenceHome': 'reference_home',
      'guardianshipType': 'guardianship_type',
    };
    
    return mappings[formFieldId] || formFieldId;
  };
  
  // Handle form field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    // Use functional update for safer state updates
    setFormState(prevState => ({
      ...prevState,
      [fieldId]: value
    }));
    
    // Clear any error for this field
    if (errors[fieldId]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
    
    // Make field available in window for conditional form handling
    if (typeof window !== 'undefined') {
      window.formState = {
        ...window.formState,
        [fieldId]: value
      };
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check required fields in form data
    Object.entries(generalFormData.questions).forEach(([fieldId, field]) => {
      // Handle nested fields
      if (typeof field === 'object' && field !== null && !('type' in field)) {
        Object.entries(field).forEach(([nestedId, nestedField]) => {
          if (nestedField !== null && typeof nestedField === 'object' && !('type' in nestedField)) {
            Object.entries(nestedField as Record<string, any>).forEach(([deepId, deepField]) => {
              const fullId = `${fieldId}.${nestedId}.${deepId}`;
              // Only validate if field has a type (is a form field)
              if (deepField !== null && typeof deepField === 'object' && 'type' in deepField && 
                  'required' in deepField && deepField.required) {
                if (!formState[fullId] && deepField.type !== 'checkbox') {
                  newErrors[fullId] = 'Este campo é obrigatório';
                }
              }
            });
          } else if (nestedField !== null && typeof nestedField === 'object' && 'type' in nestedField && 
                     'required' in nestedField && nestedField.required) {
            const fullId = `${fieldId}.${nestedId}`;
            if (!formState[fullId] && nestedField.type !== 'checkbox') {
              newErrors[fullId] = 'Este campo é obrigatório';
            }
          }
        });
      } else if (typeof field === 'object' && field !== null && 'type' in field && field.required) {
        if (!formState[fieldId] && field.type !== 'checkbox') {
          newErrors[fieldId] = 'Este campo é obrigatório';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle approving or rejecting a field change
  const handleFieldApproval = async (dbFieldName: string, approve: boolean) => {
    if (!user?.uid || !plan?.id) {
      toast({
        title: 'Erro',
        description: 'Erro de autenticação ou plano inválido.',
        variant: 'destructive'
      });
      return;
    }
    
    setApprovingField(dbFieldName);
    
    try {
      // Function is now imported at the top of the file
      
      // Call the backend function
      await approveField(
        plan.id,
        'general', // section
        dbFieldName,
        approve, // true to approve, false to reject
        user.uid
      );
      
      // Show success message
      toast({
        title: approve ? 'Alteração aprovada' : 'Alteração rejeitada',
        description: approve ? 
          'A alteração foi aprovada com sucesso.' : 
          'A alteração foi rejeitada e o valor foi revertido.',
        variant: 'default'
      });
      
      // Refresh plan data to update the UI
      const updatedPlan = await getParentalPlan(plan.id);
      if (updatedPlan) {
        setPlan(updatedPlan);
        
        // Remove this field from pending fields
        setPendingFields(prevFields => 
          prevFields.filter(field => field.dbFieldName !== dbFieldName)
        );
      }
    } catch (error) {
      console.error('Error approving/rejecting field:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a alteração. Por favor, tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setApprovingField(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.uid || !plan?.id) {
      setGlobalError('Erro de autenticação ou plano inválido.');
      return;
    }
    
    const isValid = validateForm();
    if (!isValid) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }
    
    setSubmitting(true);
    setGlobalError('');
    
    try {
      // For each changed field, update in database
      const validFieldPromises = [];
      
      // Track which fields were actually modified from their original values
      // since formState contains all fields, even unchanged ones
      const originalValues: Record<string, any> = {};
      
      // Get original values from the plan
      if (plan.sections.general) {
        Object.entries(plan.sections.general).forEach(([key, value]) => {
          // For field status objects, get the current value
          if (value && typeof value === 'object' && 'value' in value) {
            originalValues[key] = value.value;
          } else {
            originalValues[key] = value;
          }
        });
      }
      
      for (const [fieldId, value] of Object.entries(formState)) {
        const dbFieldName = mapToDatabaseFieldName(fieldId);
        
        // Skip fields that don't have a proper mapping 
        // (like complex nested fields with special characters)
        if (dbFieldName && dbFieldName !== fieldId) {
          // Check if the value has actually changed
          const originalValue = originalValues[dbFieldName];
          
          // Only update fields that have changed from their original value
          if (originalValue !== value) {
            console.log(`Updating field ${dbFieldName}: ${originalValue} -> ${value}`);
            
            validFieldPromises.push(
              updatePlanField(
                plan.id,
                'general', // section name
                dbFieldName,
                value,
                user.uid
              )
            );
          }
        }
      }
      
      // Wait for all valid field updates to complete
      const promises = validFieldPromises;
      
      await Promise.all(promises);
      
      toast({
        title: 'Alterações enviadas para aprovação',
        description: 'As alterações foram salvas e enviadas para aprovação dos outros editores do plano.',
        variant: 'default'
      });
      
      // Refresh plan data after submission
      const updatedPlan = await getParentalPlan(plan.id);
      if (updatedPlan) {
        setPlan(updatedPlan);
        setHasPendingChanges(true); // Set to true since we just submitted changes
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
      <h1 className="text-2xl font-bold mb-6">Guarda e Informações Gerais</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Nessa seção você definirá aspectos gerais da guarda da criança, incluindo o lar de referência, 
          tipo de guarda e questões sobre pensão alimentícia.
        </p>
      </div>
      
      {/* Pending Changes section */}
      {pendingFields.length > 0 && (
        <div className="mb-8 border border-yellow-200 bg-yellow-50 p-4 rounded-md">
          <h2 className="font-semibold text-lg mb-2">Alterações Pendentes</h2>
          <p className="text-sm text-gray-600 mb-4">
            As seguintes alterações estão pendentes de aprovação:
          </p>
          
          <div className="space-y-4">
            {pendingFields.map((field) => (
              <div key={field.dbFieldName} className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{field.label}</h3>
                  <div className="text-xs text-gray-500">
                    Atualizado por {field.updatedByName} em {new Date(field.updatedAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Valor Anterior:</div>
                    <div className="p-2 bg-gray-50 rounded">
                      {field.previousValue !== undefined ? String(field.previousValue) : '(Nenhum valor)'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Novo Valor:</div>
                    <div className="p-2 bg-blue-50 rounded">
                      {String(field.currentValue)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFieldApproval(field.dbFieldName, false)}
                    disabled={approvingField === field.dbFieldName}
                  >
                    {approvingField === field.dbFieldName ? 'Processando...' : 'Rejeitar'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleFieldApproval(field.dbFieldName, true)}
                    disabled={approvingField === field.dbFieldName}
                  >
                    {approvingField === field.dbFieldName ? 'Processando...' : 'Aprovar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8">
        <FormLayout
          sections={[{
            ...generalFormData,
            questions: {
              ...generalFormData.questions,
              // Update referenceHome to use editor names
              referenceHome: {
                ...generalFormData.questions.referenceHome,
                options: editors.map(editor => ({
                  value: editor.id,
                  label: editor.name // Just the editor name, no "Lar de" prefix
                })).concat([
                  { value: 'alternado', label: 'Alternado' }
                ])
              },
              // Keep guardianshipType options the same - they're not related to editor names
              guardianshipType: {
                ...generalFormData.questions.guardianshipType
              },
              // Use restructured fields for child support sections
              childSupportEmployed: {
                ...generalFormData.questions.childSupportEmployed
              },
              childSupportUnemployed: {
                ...generalFormData.questions.childSupportUnemployed
              }
            }
          }]}
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
        
        {/* Changelog Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Histórico de Alterações</h2>
          {plan && <PlanChangeLog planId={plan.id} limit={10} />}
        </div>
      </div>
    </div>
  );
};

export default GuardaPage;
