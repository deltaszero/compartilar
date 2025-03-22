'use client';

import { useState, use, useEffect, useCallback } from 'react';
import { usePlan } from '../context';
import { EducationSection, FieldStatus } from '../../types';
import { useUser } from '@/context/userContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, BookOpen, School, Briefcase, Users, PhoneCall, GraduationCap, CheckCircle, XCircle, AlertCircle, MessageSquare, Undo, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { educationFormFields } from '../../data/regularEducationFormData';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getAuth } from 'firebase/auth';

// Form field categories to organize the form in a vertical layout
const formCategories = [
  {
    id: 'school-info',
    title: 'Escola',
    description: 'Informações sobre a escola',
    icon: <School className="h-5 w-5" />,
    fields: ['school', 'tuition_responsible']
  },
  {
    id: 'materials',
    title: 'Materiais',
    description: 'Custos com materiais escolares',
    icon: <BookOpen className="h-5 w-5" />,
    fields: ['supplies_responsible', 'supplies_percentage', 'uniform_responsible', 'uniform_percentage', 'books_responsible', 'books_percentage']
  },
  {
    id: 'activities',
    title: 'Atividades',
    description: 'Atividades escolares e excursões',
    icon: <Briefcase className="h-5 w-5" />,
    fields: ['activities_responsible', 'activities_percentage', 'excursions_responsible', 'excursions_percentage']
  },
  {
    id: 'emergency',
    title: 'Emergência',
    description: 'Contatos de emergência',
    icon: <PhoneCall className="h-5 w-5" />,
    fields: ['emergency_contact', 'emergency_who', 'transport_responsible']
  },
  {
    id: 'tutor',
    title: 'Professor',
    description: 'Reforço escolar e professor particular',
    icon: <GraduationCap className="h-5 w-5" />,
    fields: ['tutor_decision', 'tutor_payment', 'tutor_percentage']
  },
  {
    id: 'family',
    title: 'Família',
    description: 'Autorizações para família extensa',
    icon: <Users className="h-5 w-5" />,
    fields: ['extended_family_school', 'extended_family_activities', 'school_events']
  }
];

// Approval status badge component
const ApprovalBadge = ({ 
  status, 
  onApprove, 
  onReject, 
  fieldName,
  onCancelChange,
  currentUserId
}: { 
  status: FieldStatus | undefined; 
  onApprove: (fieldName: string) => void;
  onReject: (fieldName: string) => void;
  fieldName: string;
  onCancelChange?: (fieldName: string) => void;
  currentUserId?: string;
}) => {
  if (!status) return null;
  
  // Format date to readable format
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if current user is the one who made the change
  const isChangeAuthor = currentUserId && status.lastUpdatedBy === currentUserId;
  
  // Determine if field is awaiting approval (not approved and no rejection comments)
  const isAwaitingApproval = !status.approved && !status.comments;
  
  return (
    <div className="flex items-center gap-2 mt-1">
      {status.approved ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Aprovado</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aprovado em {formatDate(status.lastUpdatedAt)}</p>
              {status.comments && <p>Comentário: {status.comments}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : isAwaitingApproval ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Aguardando aprovação</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizado em {formatDate(status.lastUpdatedAt)}</p>
              <p>Aguardando aprovação do outro responsável</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Sem acordo</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizado em {formatDate(status.lastUpdatedAt)}</p>
              {status.comments && <p>Comentário: {status.comments}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Show different buttons based on user role */}
      {isChangeAuthor && isAwaitingApproval ? (
        /* Author of change can only cancel while pending */
        onCancelChange && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onCancelChange(fieldName)}
            >
              <Undo className="h-3 w-3" />
              <span className="sr-only">Cancelar</span>
            </Button>
          </div>
        )
      ) : !isChangeAuthor && isAwaitingApproval ? (
        /* Other parent can approve/reject */
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onApprove(fieldName)}
          >
            <CheckCircle className="h-3 w-3" />
            <span className="sr-only">Aprovar</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onReject(fieldName)}
          >
            <XCircle className="h-3 w-3" />
            <span className="sr-only">Rejeitar</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

// Comment dialog component
const CommentDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  fieldName, 
  approving 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (fieldName: string, approved: boolean, comments: string) => void; 
  fieldName: string;
  approving: boolean;
}) => {
  const [comments, setComments] = useState('');
  
  const handleSave = () => {
    onSave(fieldName, approving, comments);
    onClose();
    setComments('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle id="comment-dialog-title">
            {approving ? 'Aprovar campo' : 'Rejeitar campo'}
          </DialogTitle>
          <DialogDescription>
            {approving 
              ? 'Adicione um comentário opcional para a aprovação.' 
              : 'Por favor, explique o motivo da rejeição deste campo.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Adicione seu comentário..."
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className={approving ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
            {approving ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Field component for modularity
const FormField = ({ 
  field, 
  register, 
  watch, 
  formState, 
  educationData,
  onFieldChange,
  onApproveField,
  onRejectField,
  onCancelChange,
  currentUserId,
  fieldsBeingCancelled
}: any) => {
  const watchedValues = watch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFieldName, setCurrentFieldName] = useState('');
  const [isApproving, setIsApproving] = useState(true);
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFieldChange) {
      onFieldChange(field.name, e.target.value);
    }
  }, [field.name, onFieldChange]);
  
  const handleRadioChange = useCallback((value: string) => {
    if (onFieldChange) {
      onFieldChange(field.name, value);
    }
  }, [field.name, onFieldChange]);
  
  const handleConditionalFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFieldChange && field.conditionalField) {
      onFieldChange(field.conditionalField.field.name, e.target.value);
    }
  }, [field.conditionalField, onFieldChange]);
  
  const handleApprove = useCallback((fieldName: string) => {
    setCurrentFieldName(fieldName);
    setIsApproving(true);
    setIsDialogOpen(true);
  }, []);
  
  const handleReject = useCallback((fieldName: string) => {
    setCurrentFieldName(fieldName);
    setIsApproving(false);
    setIsDialogOpen(true);
  }, []);
  
  const handleSaveComment = useCallback((fieldName: string, approved: boolean, comments: string) => {
    if (approved && onApproveField) {
      onApproveField(fieldName, comments);
    } else if (!approved && onRejectField) {
      onRejectField(fieldName, comments);
    }
  }, [onApproveField, onRejectField]);
  
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);
  
  // Check if the field has a FieldStatus object
  const fieldValue = educationData?.[field.name as keyof EducationSection];
  const isFieldObject = fieldValue && typeof fieldValue === 'object';
  
  // Get display value based on whether it's a FieldStatus object or a primitive
  let displayValue;
  if (isFieldObject) {
    const fieldStatus = fieldValue as FieldStatus;
    if (fieldStatus.approved) {
      // If approved, show the approved value
      displayValue = fieldStatus.value;
    } else if (fieldStatus.comments) {
      // If rejected with comment, show "No agreement" indicator
      displayValue = fieldStatus.value;
    } else {
      // If pending approval (no comments, not approved), keep showing the original form value
      displayValue = fieldStatus.value;
    }
  } else {
    // For regular values, just use the value directly
    displayValue = fieldValue;
  }
  
  switch (field.type) {
    case 'text':
      // Create local state to manage input value without relying on register
      const [textValue, setTextValue] = useState(displayValue || '');
      
      // Update local state when displayValue changes
      useEffect(() => {
        if (displayValue !== undefined) {
          console.log(`Updating text field ${field.name} value to:`, displayValue);
          setTextValue(displayValue);
        }
      }, [displayValue, field.name]);
      
      const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setTextValue(newValue);
        if (onFieldChange) {
          onFieldChange(field.name, newValue);
        }
      };
      
      return (
        <div className="mb-4" key={field.id}>
          <div className="flex justify-between items-start">
            <Label htmlFor={field.id} className="block mb-2 text-sm sm:text-base font-medium">{field.label}</Label>
            {isFieldObject && (
              <ApprovalBadge 
                status={fieldValue as FieldStatus}
                onApprove={handleApprove}
                onReject={handleReject}
                fieldName={field.name}
                onCancelChange={onCancelChange}
                currentUserId={currentUserId}
              />
            )}
          </div>
          <Input
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            className="w-full"
            value={textValue}
            onChange={handleTextChange}
            disabled={fieldsBeingCancelled?.has(field.name)}
            // No more conflict with register
          />
          {field.required && !textValue && (
            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
          )}
          
          {isDialogOpen && currentFieldName === field.name && (
            <CommentDialog 
              isOpen={true}
              onClose={handleCloseDialog}
              onSave={handleSaveComment}
              fieldName={field.name}
              approving={isApproving}
            />
          )}
        </div>
      );
    case 'radio':
      // Use local state for radio value
      const [radioValue, setRadioValue] = useState(displayValue || '');
      
      // Update local state when displayValue changes
      useEffect(() => {
        if (displayValue !== undefined) {
          console.log(`Updating radio field ${field.name} value to:`, displayValue);
          setRadioValue(displayValue);
        }
      }, [displayValue, field.name]);
      
      const handleRadioChangeLocal = (value: string) => {
        setRadioValue(value);
        if (onFieldChange) {
          onFieldChange(field.name, value);
        }
      };
      
      return (
        <div className="mb-6" key={field.id}>
          <div className="flex justify-between items-start">
            <Label className="block mb-2 text-sm sm:text-base font-medium">{field.label}</Label>
            {isFieldObject && (
              <ApprovalBadge 
                status={fieldValue as FieldStatus}
                onApprove={handleApprove}
                onReject={handleReject}
                fieldName={field.name}
                onCancelChange={onCancelChange}
                currentUserId={currentUserId}
              />
            )}
          </div>
          <RadioGroup
            value={radioValue}
            className="space-y-2"
            onValueChange={handleRadioChangeLocal}
            disabled={fieldsBeingCancelled?.has(field.name)}
          >
            {field.options.map((option: any) => (
              <div className="flex items-center space-x-2" key={option.id}>
                <RadioGroupItem
                  value={option.value}
                  id={option.id}
                />
                <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {field.required && !radioValue && (
            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
          )}
          
          {/* Render conditional field if needed */}
          {field.conditionalField && 
            watchedValues[field.conditionalField.showIf as keyof EducationSection] === field.conditionalField.equals && (
              <div className="mt-2 ml-4 pl-2 border-l-2 border-gray-200">
                <div className="flex justify-between items-start">
                  <Label htmlFor={field.conditionalField.field.id} className="block mb-2 text-sm">
                    {field.conditionalField.field.label}
                  </Label>
                  
                  {educationData?.[field.conditionalField.field.name] && 
                   typeof educationData[field.conditionalField.field.name] === 'object' && (
                    <ApprovalBadge 
                      status={educationData[field.conditionalField.field.name] as FieldStatus}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      fieldName={field.conditionalField.field.name}
                      onCancelChange={onCancelChange}
                      currentUserId={currentUserId}
                    />
                  )}
                </div>
                {/* Use a local component with its own state for conditional fields */}
                {(() => {
                  // Get conditional field value
                  const conditionalFieldValue = educationData?.[field.conditionalField.field.name];
                  const isConditionalFieldObject = conditionalFieldValue && typeof conditionalFieldValue === 'object';
                  const conditionalDisplayValue = isConditionalFieldObject 
                    ? (conditionalFieldValue as FieldStatus).value 
                    : conditionalFieldValue;
                  
                  // Local state for this specific conditional field
                  const [conditionalTextValue, setConditionalTextValue] = useState(conditionalDisplayValue || '');
                  
                  // Update local state when display value changes
                  useEffect(() => {
                    if (conditionalDisplayValue !== undefined) {
                      console.log(`Updating conditional field ${field.conditionalField.field.name} value to:`, conditionalDisplayValue);
                      setConditionalTextValue(conditionalDisplayValue);
                    }
                  }, [conditionalDisplayValue, field.conditionalField.field.name]);
                  
                  const handleConditionalTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = e.target.value;
                    setConditionalTextValue(newValue);
                    if (onFieldChange) {
                      onFieldChange(field.conditionalField.field.name, newValue);
                    }
                  };
                  
                  return (
                    <Input
                      id={field.conditionalField.field.id}
                      type="text"
                      placeholder={field.conditionalField.field.placeholder}
                      className="w-full"
                      value={conditionalTextValue}
                      onChange={handleConditionalTextChange}
                      disabled={fieldsBeingCancelled?.has(field.conditionalField.field.name)}
                    />
                  );
                })()}
                
                {isDialogOpen && currentFieldName === field.conditionalField.field.name && (
                  <CommentDialog 
                    isOpen={true}
                    onClose={handleCloseDialog}
                    onSave={handleSaveComment}
                    fieldName={field.conditionalField.field.name}
                    approving={isApproving}
                  />
                )}
              </div>
            )
          }
          
          {isDialogOpen && currentFieldName === field.name && (
            <CommentDialog 
              isOpen={true}
              onClose={handleCloseDialog}
              onSave={handleSaveComment}
              fieldName={field.name}
              approving={isApproving}
            />
          )}
        </div>
      );
    default:
      return null;
  }
};

// API service functions
const educationService = {
  // Get token from Firebase Auth directly
  getToken: async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No current user - user may need to reauthenticate');
        throw new Error('User not authenticated');
      }
      
      // Force token refresh to ensure we have a fresh token
      return await currentUser.getIdToken(true);
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication error - please refresh the page and try again');
    }
  },
  
  // Update a field in the education section
  updateField: async (planId: string, fieldName: string, value: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`Updating field ${fieldName} with auth token`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          fieldName,
          value,
          changeDescription: `Campo ${fieldName} atualizado`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error updating field: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  },
  
  // Approve or reject a field
  approveField: async (planId: string, fieldName: string, approved: boolean, comments?: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`${approved ? 'Approving' : 'Rejecting'} field ${fieldName}`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          fieldName,
          approved,
          comments
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error ${approved ? 'approving' : 'rejecting'} field: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Failed to ${approved ? 'approve' : 'reject'} field:`, error);
      throw error;
    }
  },
  
  // Cancel a pending field change
  cancelFieldChange: async (planId: string, fieldName: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`Cancelling field change for ${fieldName}`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education?fieldName=${fieldName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error cancelling field change: ${response.status}`);
      }
      
      // Parse the response
      const result = await response.json();
      console.log(`Cancellation result for ${fieldName}:`, result);
      
      return result;
    } catch (error) {
      console.error('Failed to cancel field change:', error);
      throw error;
    }
  }
};

export default function EducationPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error, refreshPlan } = usePlan();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [fieldsBeingCancelled, setFieldsBeingCancelled] = useState<Set<string>>(new Set());

  // Initialize the form with education data
  const { register, handleSubmit, watch, reset, formState } = useForm<EducationSection>();
  
  // Update form when plan data changes
  useEffect(() => {
    if (plan?.sections?.education) {
      reset(plan.sections.education);
    }
  }, [plan, reset]);

  // Check for changes in the form
  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [pendingChanges]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold text-center mb-4">Erro</h1>
            <p className="text-center text-gray-500">{error || 'Plano não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const educationData = plan.sections.education;

  // Handler for individual field changes
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);
  
  // Handler for field approval
  const handleApproveField = useCallback(async (fieldName: string, comments?: string) => {
    if (!user) return;
    
    try {
      await educationService.approveField(resolvedParams.id, fieldName, true, comments);
      await refreshPlan();
      
      toast({
        title: 'Campo aprovado',
        description: 'O campo foi aprovado com sucesso',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error approving field:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o campo',
        variant: 'destructive',
      });
    }
  }, [user, resolvedParams.id, refreshPlan, toast]);
  
  // Handler for field rejection
  const handleRejectField = useCallback(async (fieldName: string, comments?: string) => {
    if (!user) return;
    
    try {
      await educationService.approveField(resolvedParams.id, fieldName, false, comments);
      await refreshPlan();
      
      toast({
        title: 'Campo rejeitado',
        description: 'O campo foi marcado como sem acordo',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error rejecting field:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o campo',
        variant: 'destructive',
      });
    }
  }, [user, resolvedParams.id, refreshPlan, toast]);
  
  // Handler for cancelling a pending field change
  const handleCancelFieldChange = useCallback(async (fieldName: string) => {
    if (!user) return;
    
    // Mark field as being cancelled
    setFieldsBeingCancelled(prev => {
      const updated = new Set(prev);
      updated.add(fieldName);
      return updated;
    });
    
    try {
      const result = await educationService.cancelFieldChange(resolvedParams.id, fieldName);
      
      // Remove field from pending changes
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[fieldName];
        return newChanges;
      });
      
      // Force a refresh of the plan data to get the updated values
      await refreshPlan();
      
      // Make sure the UI form state is also reset
      if (plan?.sections?.education) {
        // If we got a reverted value from the API, manually update the field
        if (result.revertedValue !== undefined) {
          console.log(`Field ${fieldName} was reverted to: ${result.revertedValue}`);
          
          // Create a shallow copy of the education section
          const updatedEducation = { ...plan.sections.education };
          
          // Set the field to the reverted value directly
          updatedEducation[fieldName] = result.revertedValue;
          
          // Update the form - this will trigger the useEffect hooks 
          // in the form components that listen for displayValue changes
          reset(updatedEducation);
        } else {
          // Fallback to a normal reset with the current plan data
          setTimeout(() => {
            reset(plan.sections.education);
          }, 100);
        }
      }
      
      toast({
        title: 'Solicitação cancelada',
        description: 'A alteração foi cancelada com sucesso',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error cancelling field change:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a alteração',
        variant: 'destructive',
      });
    } finally {
      // Remove field from being cancelled state
      setFieldsBeingCancelled(prev => {
        const updated = new Set(prev);
        updated.delete(fieldName);
        return updated;
      });
    }
  }, [user, resolvedParams.id, refreshPlan, toast, plan, reset]);

  // Submit a single field change
  const handleSaveField = useCallback(async (fieldName: string) => {
    if (!user || !pendingChanges[fieldName]) return;
    
    setIsSubmitting(true);
    
    try {
      await educationService.updateField(resolvedParams.id, fieldName, pendingChanges[fieldName]);
      
      // Remove this field from pending changes
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[fieldName];
        return newChanges;
      });
      
      await refreshPlan();
      
      toast({
        title: 'Campo atualizado',
        description: 'O campo foi atualizado e aguarda aprovação',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o campo',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, pendingChanges, resolvedParams.id, refreshPlan, toast]);

  // Submit all pending changes
  const handleSaveAllChanges = useCallback(async () => {
    if (!user || Object.keys(pendingChanges).length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Save each field one by one
      const promises = Object.entries(pendingChanges).map(([fieldName, value]) => 
        educationService.updateField(resolvedParams.id, fieldName, value)
      );
      
      await Promise.all(promises);
      
      // Clear pending changes
      setPendingChanges({});
      
      await refreshPlan();
      
      toast({
        title: 'Alterações salvas',
        description: 'Todas as alterações foram salvas e aguardam aprovação',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating fields:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar todas as alterações',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, pendingChanges, resolvedParams.id, refreshPlan, toast]);

  // Get fields for a specific category - memoize to prevent recalculations
  const getCategoryFields = useCallback((categoryId: string) => {
    const category = formCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return educationFormFields.filter(field => 
      category.fields.includes(field.name) || 
      (field.conditionalField && category.fields.includes(field.conditionalField.field.name))
    );
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Educação Regular</h1>
        {hasChanges && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleSaveAllChanges}
              disabled={isSubmitting}
              className="bg-main hover:bg-main/90 w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button 
              onClick={() => setPendingChanges({})}
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
            >
              <Undo className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {formCategories.map(category => (
          <Card key={category.id} className="w-full">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <div className="p-2 rounded-full bg-main/10 text-main">
                {category.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getCategoryFields(category.id).map(field => (
                  <div key={field.id} className="relative">
                    <FormField 
                      field={field}
                      register={register}
                      watch={watch}
                      formState={formState}
                      educationData={educationData}
                      onFieldChange={handleFieldChange}
                      onApproveField={handleApproveField}
                      onRejectField={handleRejectField}
                      onCancelChange={handleCancelFieldChange}
                      currentUserId={user?.uid}
                      fieldsBeingCancelled={fieldsBeingCancelled}
                    />
                    
                    {pendingChanges[field.name] && (
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleSaveField(field.name)}
                          disabled={isSubmitting}
                        >
                          <Save className="mr-1 h-3 w-3" />
                          Salvar
                        </Button>
                      </div>
                    )}
                    
                    {/* Handle conditional fields with pending changes */}
                    {field.conditionalField && pendingChanges[field.conditionalField.field.name] && (
                      <div className="flex justify-end mt-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleSaveField(field.conditionalField.field.name)}
                          disabled={isSubmitting}
                        >
                          <Save className="mr-1 h-3 w-3" />
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {hasChanges && (
          <div className="sticky bottom-0 bg-background p-4 border-t border-gray-200 rounded-lg shadow-lg mt-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleSaveAllChanges}
                disabled={isSubmitting}
                className="bg-main hover:bg-main/90 w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button 
                onClick={() => setPendingChanges({})}
                disabled={isSubmitting}
                variant="outline"
                className="w-full"
              >
                <Undo className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}