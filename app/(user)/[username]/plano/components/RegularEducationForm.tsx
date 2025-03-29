'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { educationFormFields, regularEducationInitialValues } from '../data/regularEducationFormData';
import { EducationSection, FieldStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

interface EditorInfo {
    id: string;
    displayName: string;
    firstName?: string | null;
    lastName?: string | null;
    photoURL?: string | null;
    email?: string | null;
}

interface EditorProportionSlidersProps {
    editors: EditorInfo[];
    fieldName?: string;
    currentValue?: string;
    onChange?: (value: string) => void;
    onSave?: () => void;
    onCancel?: () => void;
    register?: any;
    setValue?: any;
    initialValue?: string;
    disabled?: boolean;
}

// Component for handling editor proportion sliders
const EditorProportionSliders: React.FC<EditorProportionSlidersProps> = ({
    editors,
    fieldName,
    currentValue,
    onChange,
    onSave,
    onCancel,
    register,
    setValue,
    initialValue,
    disabled = false
}) => {
    // Initialize proportions from either current editing value or initial value
    const initialProportions = useMemo(() => {
        const proportionText = currentValue || initialValue || '';
        const proportions = new Map<string, number>();
        
        // Set default equal proportions
        if (editors.length > 0) {
            const equalShare = Math.floor(100 / editors.length);
            editors.forEach((editor) => {
                proportions.set(editor.id, equalShare);
            });
            
            // Assign remainder to first editor
            const remainder = 100 - (equalShare * editors.length);
            if (remainder > 0 && editors.length > 0) {
                proportions.set(editors[0].id, equalShare + remainder);
            }
        }
        
        // If a string value exists, parse it
        if (proportionText) {
            try {
                // Try to parse something like "Editor1 50%, Editor2 50%"
                const parts = proportionText.split(',').map(p => p.trim());
                
                // Clear any previous values
                proportions.clear();
                
                // Set total to ensure we never go over 100%
                let total = 0;
                
                parts.forEach(part => {
                    // Look for patterns like "Editor Name 50%"
                    const match = part.match(/(.+)\s+(\d+)%/);
                    if (match) {
                        const [_, editorName, percentage] = match;
                        const percent = parseInt(percentage, 10);
                        
                        // Find editor by name
                        const editor = editors.find(e => {
                            const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim();
                            return e.displayName.includes(editorName) || 
                                   editorName.includes(e.displayName) ||
                                   (fullName && (fullName.includes(editorName) || editorName.includes(fullName)));
                        });
                        
                        if (editor && percent >= 0 && percent <= 100 && total + percent <= 100) {
                            proportions.set(editor.id, percent);
                            total += percent;
                        }
                    }
                });
                
                // If we didn't assign 100%, distribute the remainder
                if (total < 100 && editors.length > 0) {
                    const remainder = 100 - total;
                    const unassignedEditors = editors.filter(e => !proportions.has(e.id));
                    
                    if (unassignedEditors.length > 0) {
                        const sharePerEditor = Math.floor(remainder / unassignedEditors.length);
                        unassignedEditors.forEach((editor, index) => {
                            if (index === unassignedEditors.length - 1) {
                                // Last editor gets any remaining amount to ensure we hit 100%
                                proportions.set(editor.id, remainder - (sharePerEditor * (unassignedEditors.length - 1)));
                            } else {
                                proportions.set(editor.id, sharePerEditor);
                            }
                        });
                    } else if (editors.length > 0) {
                        // If all editors have some assignment, add remainder to first editor
                        const firstEditor = editors[0];
                        proportions.set(firstEditor.id, (proportions.get(firstEditor.id) || 0) + remainder);
                    }
                }
            } catch (e) {
                console.error('Error parsing proportions:', e);
                // If parsing fails, fall back to equal proportions
            }
        }
        
        return proportions;
    }, [currentValue, initialValue, editors]);
    
    // Store current proportions in state
    const [proportions, setProportions] = useState<Map<string, number>>(initialProportions);
    
    // Function to update proportions for an editor
    const updateProportion = (editorId: string, newValue: number) => {
        // Round to nearest 5%
        const roundedValue = Math.round(newValue / 5) * 5;
        
        // Create a copy of the current proportions
        const newProportions = new Map(proportions);
        
        // Calculate the difference
        const oldValue = proportions.get(editorId) || 0;
        const diff = roundedValue - oldValue;
        
        if (diff === 0) return; // No change
        
        // Update the editor's proportion
        newProportions.set(editorId, roundedValue);
        
        // Distribute the difference among other editors
        const otherEditors = editors.filter(e => e.id !== editorId);
        
        if (otherEditors.length === 0) {
            // If there are no other editors, keep it at 100%
            newProportions.set(editorId, 100);
        } else {
            // Calculate how much to take from or give to other editors
            const totalOtherProportions = otherEditors.reduce((total, editor) => 
                total + (proportions.get(editor.id) || 0), 0);
                
            if (totalOtherProportions === 0) {
                // If other editors have 0%, distribute equally
                const equalShare = Math.floor((100 - roundedValue) / otherEditors.length);
                otherEditors.forEach((editor, index) => {
                    if (index === otherEditors.length - 1) {
                        // Last editor gets remainder to ensure 100% total
                        newProportions.set(editor.id, 100 - roundedValue - (equalShare * (otherEditors.length - 1)));
                    } else {
                        newProportions.set(editor.id, equalShare);
                    }
                });
            } else {
                // Proportionally distribute the difference
                const newTotalForOthers = totalOtherProportions - diff;
                
                // Make sure we don't go negative
                if (newTotalForOthers <= 0) {
                    // If adjustment would make others negative, set them all to 0 and adjust this one
                    otherEditors.forEach(editor => newProportions.set(editor.id, 0));
                    newProportions.set(editorId, 100);
                } else {
                    // Distribute proportionally
                    const ratio = newTotalForOthers / totalOtherProportions;
                    
                    let remainingPercent = 100 - roundedValue;
                    otherEditors.forEach((editor, index) => {
                        const oldProportion = proportions.get(editor.id) || 0;
                        
                        if (index === otherEditors.length - 1) {
                            // Last editor gets what's left to ensure 100% total
                            newProportions.set(editor.id, remainingPercent);
                        } else {
                            // Round to nearest 5% for consistency
                            const newProportion = Math.round((oldProportion * ratio) / 5) * 5;
                            newProportions.set(editor.id, newProportion);
                            remainingPercent -= newProportion;
                        }
                    });
                }
            }
        }
        
        // Save the new proportions
        setProportions(newProportions);
        
        // Format the proportions as a string
        const proportionString = Array.from(newProportions.entries())
            .map(([editorId, percent]) => {
                const editor = editors.find(e => e.id === editorId);
                if (!editor) return '';
                
                // Use firstName and lastName if available, otherwise displayName
                const editorName = (editor.firstName || editor.lastName) ? 
                    `${editor.firstName || ''} ${editor.lastName || ''}`.trim() : 
                    editor.displayName;
                    
                return `${editorName} ${percent}%`;
            })
            .filter(Boolean)
            .join(', ');
            
        // Directly call the onChange handler with the string
        // without using setState which would cause a re-render
        if (onChange) {
            onChange(proportionString);
        }
        
        // If we're in batch mode with setValue
        if (setValue && fieldName) {
            // Set the value directly without causing a re-render
            setValue(fieldName, proportionString, { shouldValidate: false });
        }
    };
    
    return (
        <div className="space-y-4">
            {editors.map((editor) => {
                const proportion = proportions.get(editor.id) || 0;
                const displayName = (editor.firstName || editor.lastName) ? 
                    `${editor.firstName || ''} ${editor.lastName || ''}`.trim() : 
                    editor.displayName;
                    
                return (
                    <div key={editor.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm">{displayName}</Label>
                            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {proportion}%
                            </span>
                        </div>
                        <Slider
                            value={[proportion]}
                            min={0}
                            max={100}
                            step={5}
                            disabled={disabled}
                            className="cursor-pointer"
                            onValueChange={([value]) => updateProportion(editor.id, value)}
                        />
                    </div>
                );
            })}
            
            {/* Register hidden field when in batch mode */}
            {register && fieldName && (
                <input type="hidden" {...register(fieldName)} />
            )}
            
            {/* Show buttons when in edit mode */}
            {onSave && onCancel && (
                <div className="flex space-x-2 justify-end mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                    >
                        Salvar
                    </Button>
                </div>
            )}
        </div>
    );
};

interface RegularEducationFormProps {
    initialData?: EducationSection;
    onSubmit: (data: EducationSection) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    planId?: string;
    onFieldChange?: (fieldName: string, value: string) => Promise<any>;
    onApproveField?: (fieldName: string, approved: boolean, comments?: string) => Promise<any>;
    onCancelChange?: (fieldName: string) => Promise<any>;
    currentUserId?: string;
    isEditMode?: boolean;
    editors?: EditorInfo[]; // Add editors prop
}

export default function RegularEducationForm({
    initialData = regularEducationInitialValues,
    onSubmit,
    onCancel,
    isSubmitting,
    planId,
    onFieldChange,
    onApproveField,
    onCancelChange,
    currentUserId,
    isEditMode = false,
    editors = [] // Default to empty array
}: RegularEducationFormProps) {
    const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<EducationSection>({
        defaultValues: initialData
    });
    const { toast } = useToast();
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editFieldValue, setEditFieldValue] = useState<string>('');
    const [proportionValue, setProportionValue] = useState<string>('');
    const [approvalComments, setApprovalComments] = useState<string>('');
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
    const [isEditingProportions, setIsEditingProportions] = useState(false);

    // Watch form values to handle conditional fields
    const watchedValues = watch();

    // Reset the form to the initial values
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const processSubmit = async (data: EducationSection) => {
        try {
            if (isBatchEditMode) {
                setIsSubmittingBatch(true);
            }

            await onSubmit(data);

            toast({
                title: "Sucesso",
                description: "Informações de educação salvas com sucesso.",
            });

            // Exit batch edit mode after successful submission
            if (isBatchEditMode) {
                setIsBatchEditMode(false);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao salvar as informações.",
                variant: "destructive",
            });
        } finally {
            if (isBatchEditMode) {
                setIsSubmittingBatch(false);
            }
        }
    };

    // Toggle the batch edit mode
    const toggleBatchEditMode = () => {
        if (isBatchEditMode) {
            // If exiting batch edit mode without saving, reset form
            reset(initialData);
        }
        setIsBatchEditMode(!isBatchEditMode);
    };

    const handleFieldEdit = (fieldName: string, currentValue: string | FieldStatus | undefined) => {
        if (currentValue === undefined) {
            currentValue = '';
        }

        // Extract the value to edit based on whether it's a simple string or FieldStatus object
        const valueToEdit = typeof currentValue === 'object'
            ? (currentValue as FieldStatus).value
            : currentValue;

        setEditingField(fieldName);
        setEditFieldValue(valueToEdit);

        console.log(`Editing field ${fieldName} with value: ${valueToEdit}`);
    };

    const handleFieldSave = async () => {
        if (!editingField || !onFieldChange) return;

        try {
            // Save the current field being edited
            await onFieldChange(editingField, editFieldValue);
            
            // If we're editing a responsible field and it's set to "dividido",
            // also save the proportion value
            if (editingField.includes('_responsible') && editFieldValue === 'dividido') {
                const percentageField = `${editingField.replace('_responsible', '')}_percentage`;
                await onFieldChange(percentageField, proportionValue);
            } else if (editingField.includes('_percentage')) {
                // If directly editing a percentage field, use the proportion value
                await onFieldChange(editingField, proportionValue);
            }
            
            toast({
                title: "Alteração solicitada",
                description: "As mudanças foram enviadas para aprovação.",
            });
            setEditingField(null);
        } catch (error) {
            console.error('Error updating field:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao atualizar o campo.",
                variant: "destructive",
            });
        }
    };

    const handleFieldCancel = () => {
        setEditingField(null);
        setEditFieldValue('');
        setProportionValue('');
        setIsEditingProportions(false);
    };

    const handleFieldApprove = async (fieldName: string, approved: boolean) => {
        if (!onApproveField) return;

        try {
            await onApproveField(fieldName, approved, approvalComments);
            toast({
                title: approved ? "Campo aprovado" : "Campo rejeitado",
                description: approved
                    ? "O campo foi aprovado e atualizado."
                    : "A alteração foi rejeitada e o valor anterior foi restaurado.",
            });
            setApprovalComments('');
        } catch (error) {
            console.error('Error approving/rejecting field:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao processar a aprovação.",
                variant: "destructive",
            });
        }
    };

    const handleCancelPendingChange = async (fieldName: string) => {
        if (!onCancelChange) return;

        try {
            await onCancelChange(fieldName);
            toast({
                title: "Alteração cancelada",
                description: "Sua solicitação de alteração foi cancelada.",
            });
        } catch (error) {
            console.error('Error canceling change:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao cancelar a alteração.",
                variant: "destructive",
            });
        }
    };

    // Helper function to check if a field is locked
    const isFieldLocked = (field: string | FieldStatus | undefined): boolean => {
        if (!field || typeof field !== 'object') return false;
        return field.isLocked === true;
    };

    // Helper function to check if there are any pending approvals
    const hasPendingApprovals = (): boolean => {
        if (!initialData) return false;

        // Check each field in initialData to see if any have pending status
        return Object.values(initialData).some(field => {
            if (typeof field === 'object' && field !== null) {
                return (field as FieldStatus).status === 'pending';
            }
            return false;
        });
    };

    // Helper function to get field status badge
    const getFieldStatusBadge = (field: string | FieldStatus | undefined) => {
        if (!field || typeof field !== 'object') return null;

        switch (field.status) {
            case 'pending':
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Alteração pendente de aprovação</p>
                        </TooltipContent>
                    </Tooltip>
                );
            case 'approved':
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovado
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Alteração aprovada</p>
                        </TooltipContent>
                    </Tooltip>
                );
            case 'disagreed':
                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-300">
                                <X className="h-3 w-3 mr-1" />
                                Rejeitado
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Alteração rejeitada</p>
                        </TooltipContent>
                    </Tooltip>
                );
            default:
                return null;
        }
    };

    // Helper function to generate options based on field type and editors
    const generateOptions = (fieldName: string, options: any[]) => {
        // Get the original options to check if we need to add special options like 'dividido'
        const originalOptions = options.map(option => option.value);

        // Create editor options - convert editors to radio options
        const editorOptions = editors.map(editor => {
            // Use firstName and lastName if available, or displayName as fallback
            let editorLabel = editor.displayName;

            if (editor.firstName || editor.lastName) {
                const fullName = `${editor.firstName || ''} ${editor.lastName || ''}`.trim();
                editorLabel = fullName || editor.displayName;
            }

            return {
                id: `${fieldName}-${editor.id}`,
                label: editorLabel || editor.email || 'Editor',
                value: editor.id
            };
        });

        // Add special options like 'dividido', 'conjunto', etc. if they were in the original options
        const specialOptions = [];

        if (originalOptions.includes('dividido')) {
            specialOptions.push({
                id: `${fieldName}-divided`,
                label: 'Será dividido',
                value: 'dividido'
            });
        }

        if (originalOptions.includes('publica')) {
            specialOptions.push({
                id: `${fieldName}-public`,
                label: 'Escola pública',
                value: 'publica'
            });
        }

        if (originalOptions.includes('conjunto')) {
            specialOptions.push({
                id: `${fieldName}-together`,
                label: 'Em conjunto',
                value: 'conjunto'
            });
        }

        if (originalOptions.includes('outro')) {
            specialOptions.push({
                id: `${fieldName}-other`,
                label: 'Outro',
                value: 'outro'
            });
        }

        if (originalOptions.includes('na')) {
            specialOptions.push({
                id: `${fieldName}-na`,
                label: 'Não se aplica',
                value: 'na'
            });
        }

        return [...editorOptions, ...specialOptions];
    };

    // Helper function to determine if user can modify a field
    const canEditField = (field: string | FieldStatus | undefined): boolean => {
        if (!isEditMode || !currentUserId) return false;
        if (!field || typeof field !== 'object') return true;

        // If field is locked, check if current user is the one who locked it
        if (field.isLocked) {
            return field.lastUpdatedBy === currentUserId;
        }

        return true;
    };

    // Helper function to determine if user can approve/reject a field
    const canApproveField = (field: string | FieldStatus | undefined): boolean => {
        if (!isEditMode || !currentUserId) return false;
        if (!field || typeof field !== 'object') return false;

        // Can approve if field is pending and user is not the one who made the change
        return field.status === 'pending' && field.lastUpdatedBy !== currentUserId;
    };

    // Helper function to determine if user can cancel their pending change
    const canCancelChange = (field: string | FieldStatus | undefined): boolean => {
        if (!isEditMode || !currentUserId) return false;
        if (!field || typeof field !== 'object') return false;

        // Can cancel if field is pending and user is the one who made the change
        return field.status === 'pending' && field.lastUpdatedBy === currentUserId;
    };

    // Get the actual value to display for a field
    const getDisplayValue = (field: string | FieldStatus | undefined): string => {
        if (!field) return '';
        if (typeof field === 'object') {
            return field.value || '';
        }
        return field;
    };

    const renderField = (field: any) => {
        const fieldName = field.name as keyof EducationSection;
        const fieldData = initialData[fieldName]; // Original field data (might be object or string)
        const isLocked = isFieldLocked(fieldData);
        const canEdit = canEditField(fieldData);
        const canApprove = canApproveField(fieldData);
        const canCancel = canCancelChange(fieldData);
        const displayValue = getDisplayValue(fieldData); // Extracted display value

        // In batch edit mode, we don't need to show individual edit buttons and statuses
        const showBatchMode = isBatchEditMode && isEditMode;

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.id}>
                        <div className="flex flex-col">
                            <div className='flex flex-row justify-between w-full'>
                                <div>
                                    {!showBatchMode && getFieldStatusBadge(fieldData)}
                                </div>

                                {isEditMode && !showBatchMode && (
                                    <div className="flex space-x-2 mb-2">
                                        {canEdit && editingField !== fieldName && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleFieldEdit(fieldName, fieldData)}
                                                disabled={isLocked && typeof fieldData === 'object' && fieldData.lastUpdatedBy !== currentUserId}
                                            >
                                                Editar
                                            </Button>
                                        )}

                                        {canApprove && (
                                            <div className="flex space-x-1">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-green-50 hover:bg-green-100 text-green-700"
                                                        >
                                                            Aprovar
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium">Aprovar alteração</h4>
                                                            <Textarea
                                                                placeholder="Comentários (opcional)"
                                                                value={approvalComments}
                                                                onChange={(e) => setApprovalComments(e.target.value)}
                                                                className="h-20"
                                                            />
                                                            <div className="flex justify-end space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setApprovalComments('')}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleFieldApprove(fieldName, true)}
                                                                >
                                                                    Confirmar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-red-50 hover:bg-red-100 text-red-700"
                                                        >
                                                            Rejeitar
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium">Rejeitar alteração</h4>
                                                            <Textarea
                                                                placeholder="Motivo da rejeição (opcional)"
                                                                value={approvalComments}
                                                                onChange={(e) => setApprovalComments(e.target.value)}
                                                                className="h-20"
                                                            />
                                                            <div className="flex justify-end space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setApprovalComments('')}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleFieldApprove(fieldName, false)}
                                                                >
                                                                    Confirmar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        {canCancel && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-orange-700"
                                                onClick={() => handleCancelPendingChange(fieldName)}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Label htmlFor={field.id} className="block my-2 font-nunito font-semibold text-lg">
                                {field.label.split('. ').slice(1).join('. ')}
                            </Label>
                        </div>

                        {editingField === fieldName ? (
                            <div className="space-y-2">
                                <Input
                                    id={`editing-${field.id}`}
                                    type="text"
                                    value={editFieldValue} // Use editFieldValue here, not fieldValue
                                    onChange={(e) => setEditFieldValue(e.target.value)}
                                    placeholder={field.placeholder}
                                    autoFocus
                                />
                                <div className="flex space-x-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleFieldCancel}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleFieldSave}
                                    >
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Input
                                id={field.id}
                                type="text"
                                defaultValue={displayValue}
                                placeholder={field.placeholder}
                                disabled={isEditMode && !showBatchMode && !canEdit} // Disable only in edit mode (not batch) and can't edit
                                readOnly={isEditMode && !showBatchMode && !canEdit} // For better UI feedback
                                {...(showBatchMode ? register(fieldName, { required: field.required }) : {})} // Register in batch mode
                                {...(!isEditMode ? register(fieldName, { required: field.required }) : {})} // Register in form mode
                            />
                        )}

                        {errors[fieldName] && (
                            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
                        )}

                        {isLocked && typeof fieldData === 'object' && (
                            <p className="text-amber-600 text-sm mt-1">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Campo aguardando aprovação
                            </p>
                        )}
                    </div>
                );

            case 'radio':
                return (
                    <div key={field.id}>
                        <div className="flex flex-col">
                            <div className='flex flex-row justify-between w-full'>
                                <div>
                                {!showBatchMode && getFieldStatusBadge(fieldData)}
                                </div>

                            {isEditMode && !showBatchMode && (
                                <div className="flex space-x-2">
                                    {canEdit && editingField !== fieldName && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFieldEdit(fieldName, fieldData)}
                                            disabled={isLocked && typeof fieldData === 'object' && fieldData.lastUpdatedBy !== currentUserId}
                                        >
                                            Editar
                                        </Button>
                                    )}

                                    {canApprove && (
                                        <div className="flex space-x-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-green-50 hover:bg-green-100 text-green-700"
                                                    >
                                                        Aprovar
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">Aprovar alteração</h4>
                                                        <Textarea
                                                            placeholder="Comentários (opcional)"
                                                            value={approvalComments}
                                                            onChange={(e) => setApprovalComments(e.target.value)}
                                                            className="h-20"
                                                        />
                                                        <div className="flex justify-end space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setApprovalComments('')}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleFieldApprove(fieldName, true)}
                                                            >
                                                                Confirmar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-red-50 hover:bg-red-100 text-red-700"
                                                    >
                                                        Rejeitar
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">Rejeitar alteração</h4>
                                                        <Textarea
                                                            placeholder="Motivo da rejeição (opcional)"
                                                            value={approvalComments}
                                                            onChange={(e) => setApprovalComments(e.target.value)}
                                                            className="h-20"
                                                        />
                                                        <div className="flex justify-end space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setApprovalComments('')}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleFieldApprove(fieldName, false)}
                                                            >
                                                                Confirmar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}

                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-orange-700"
                                            onClick={() => handleCancelPendingChange(fieldName)}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            )}
                            </div>
                            <Label htmlFor={field.id} className="block my-2 font-nunito font-semibold text-lg">
                                {field.label.split('. ').slice(1).join('. ')}
                            </Label>
                        </div>

                        {editingField === fieldName ? (
                            <div className="space-y-2">
                                <RadioGroup
                                    value={editFieldValue}
                                    onValueChange={(value) => {
                                        setEditFieldValue(value);
                                        
                                        // If "dividido" is selected, set up the percentage field
                                        const percentageField = `${fieldName.replace('_responsible', '')}_percentage`;
                                        if (value === 'dividido' && percentageField in initialData) {
                                            // Set flag to indicate we're now editing proportions
                                            setIsEditingProportions(true);
                                            
                                            // Initial value string for proportions based on existing values or default
                                            let proportionString = '';
                                            
                                            // Create a default with equal proportions
                                            if (editors.length > 0) {
                                                const equalShare = Math.floor(100 / editors.length);
                                                
                                                proportionString = editors.map((editor, index) => {
                                                    // Last editor gets remainder to ensure 100%
                                                    const percent = index === editors.length - 1 
                                                        ? 100 - (equalShare * (editors.length - 1))
                                                        : equalShare;
                                                        
                                                    const name = (editor.firstName || editor.lastName) ? 
                                                        `${editor.firstName || ''} ${editor.lastName || ''}`.trim() : 
                                                        editor.displayName;
                                                        
                                                    return `${name} ${percent}%`;
                                                }).join(', ');
                                            }
                                            
                                            // Store the proportion value in a separate state variable
                                            // for the sliders to use
                                            setProportionValue(proportionString);
                                        } else {
                                            // Not "dividido", so turn off proportion editing
                                            setIsEditingProportions(false);
                                        }
                                    }}
                                >
                                    {generateOptions(fieldName, field.options).map((option: any) => (
                                        <div className="flex items-center space-x-2 mb-1" key={option.id}>
                                            <RadioGroupItem
                                                value={option.value}
                                                id={`editing-${option.id}`}
                                            />
                                            <Label htmlFor={`editing-${option.id}`}>{option.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                
                                {/* Show sliders immediately if "dividido" is selected */}
                                {(editFieldValue === 'dividido' || isEditingProportions) && field.conditionalField && (
                                    <div className="ml-6 mt-3 p-4 border border-gray-200 bg-gray-50 rounded">
                                        <div className="mb-3">
                                            <Label className="block mb-1 font-medium text-sm">
                                                Proporção por Editor
                                            </Label>
                                            <p className="text-xs text-gray-500">
                                                Ajuste as proporções entre os editores (em incrementos de 5%)
                                            </p>
                                        </div>
                                        
                                        <EditorProportionSliders 
                                            editors={editors}
                                            currentValue={proportionValue}
                                            onChange={(value) => {
                                                setProportionValue(value);
                                                
                                                // When editing a responsible field, we need to keep track of both
                                                // the main radio value and the proportion value
                                                // Note: We don't update editFieldValue here to avoid re-rendering the radio buttons
                                                console.log("Slider value changed to:", value);
                                            }}
                                        />
                                    </div>
                                )}
                                
                                <div className="flex space-x-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleFieldCancel}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleFieldSave}
                                    >
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <RadioGroup
                                    defaultValue={displayValue}
                                    disabled={isEditMode && !showBatchMode && !canEdit}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        // For both batch edit mode and regular mode, update the value
                                        if (showBatchMode || !isEditMode) {
                                            setValue(fieldName, e.target.value);
                                        }
                                        
                                        // If "dividido" is selected, set up the percentage field
                                        const percentageField = `${fieldName.replace('_responsible', '')}_percentage`;
                                        if (e.target.value === 'dividido' && percentageField in initialData) {
                                            // Initial value string for proportions based on existing values or default
                                            let proportionString = '';
                                            
                                            // If there's no existing value, create a default with equal proportions
                                            if (!getDisplayValue(initialData[percentageField as keyof typeof initialData])) {
                                                if (editors.length > 0) {
                                                    const equalShare = Math.floor(100 / editors.length);
                                                    
                                                    proportionString = editors.map((editor, index) => {
                                                        // Last editor gets remainder to ensure 100%
                                                        const percent = index === editors.length - 1 
                                                            ? 100 - (equalShare * (editors.length - 1))
                                                            : equalShare;
                                                            
                                                        const name = (editor.firstName || editor.lastName) ? 
                                                            `${editor.firstName || ''} ${editor.lastName || ''}`.trim() : 
                                                            editor.displayName;
                                                            
                                                        return `${name} ${percent}%`;
                                                    }).join(', ');
                                                }
                                            }
                                            
                                            // Set the value in react-hook-form (for both create and batch edit modes)
                                            setValue(percentageField as any, proportionString);
                                        }
                                    }}
                                    {...(showBatchMode ? register(fieldName, { required: field.required }) : {})}
                                    {...(!isEditMode ? register(fieldName, { required: field.required }) : {})}
                                >
                                    {generateOptions(fieldName, field.options).map((option: any) => (
                                        <div className="flex items-center space-x-2 mb-1" key={option.id}>
                                            <RadioGroupItem
                                                value={option.value}
                                                id={option.id}
                                                disabled={isEditMode && !showBatchMode && !canEdit}
                                                {...(!isEditMode ? register(fieldName) : {})}
                                            />
                                            <Label htmlFor={option.id}>{option.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                
                                {/* Render percentage field when 'dividido' is selected */}
                                {(watchedValues[fieldName] === 'dividido' || 
                                  (typeof fieldData === 'object' && fieldData?.value === 'dividido')) && 
                                  field.conditionalField && (
                                    <div className="ml-6 mt-3 p-4 border border-gray-200 bg-gray-50 rounded">
                                        <div className="mb-3">
                                            <Label className="block mb-1 font-medium text-sm">
                                                Proporção por Editor
                                            </Label>
                                            <p className="text-xs text-gray-500">
                                                Ajuste as proporções entre os editores (em incrementos de 5%)
                                            </p>
                                        </div>
                                        
                                        {/* Always show sliders in batch mode */}
                                        {showBatchMode || !isEditMode ? (
                                            <EditorProportionSliders 
                                                editors={editors}
                                                fieldName={field.conditionalField.field.name as any}
                                                register={register}
                                                setValue={setValue}
                                                initialValue={getDisplayValue(initialData[field.conditionalField.field.name as keyof typeof initialData])}
                                                disabled={isEditMode && !showBatchMode && !canEdit}
                                            />
                                        ) : editingField === field.conditionalField.field.name ? (
                                            /* Show sliders when actively editing this field */
                                            <EditorProportionSliders 
                                                editors={editors}
                                                currentValue={editFieldValue}
                                                onChange={setEditFieldValue}
                                                onSave={handleFieldSave}
                                                onCancel={handleFieldCancel}
                                            />
                                        ) : (
                                            /* In field-by-field mode, always show sliders but make them non-interactive until Edit is clicked */
                                            <div className="space-y-2">
                                                {getDisplayValue(initialData[field.conditionalField.field.name as keyof typeof initialData]) ? (
                                                    <EditorProportionSliders 
                                                        editors={editors}
                                                        initialValue={getDisplayValue(initialData[field.conditionalField.field.name as keyof typeof initialData])}
                                                        disabled={true}
                                                    />
                                                ) : (
                                                    <EditorProportionSliders 
                                                        editors={editors}
                                                        disabled={true}
                                                    />
                                                )}
                                                
                                                {isEditMode && !showBatchMode && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleFieldEdit(
                                                            field.conditionalField.field.name,
                                                            initialData[field.conditionalField.field.name as keyof typeof initialData]
                                                        )}
                                                        disabled={isLocked && 
                                                            typeof initialData[field.conditionalField.field.name as keyof typeof initialData] === 'object' && 
                                                            (initialData[field.conditionalField.field.name as keyof typeof initialData] as FieldStatus).lastUpdatedBy !== currentUserId}
                                                        className="w-full"
                                                    >
                                                        Editar Proporções
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {errors[fieldName] && (
                            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
                        )}

                        {isLocked && typeof fieldData === 'object' && (
                            <p className="text-amber-600 text-sm mt-1">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Campo aguardando aprovação
                            </p>
                        )}

                        {/* We've moved the conditional field rendering directly into the radio group logic above */}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <TooltipProvider>
            <div className="w-full max-w-4xl mx-auto">
                <div>
                    {isEditMode && (
                        <div className="flex flex-row justify-end items-end gap-4 my-4">
                            {isBatchEditMode ? (
                                <>
                                    <Button
                                        type="submit"
                                        form="education-form"
                                        disabled={isSubmittingBatch}
                                        className="bg-mainStrongGreen w-[100px]"
                                    >
                                        {isSubmittingBatch ? 'Salvando...' : 'Salvar'}
                                    </Button>

                                    <Button
                                        onClick={toggleBatchEditMode}
                                        className="bg-mainStrongRed w-[100px]"
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Button
                                                onClick={toggleBatchEditMode}
                                                className="bg-mainStrongGreen w-[100px]"
                                                disabled={hasPendingApprovals()}
                                            >
                                                Editar Tudo
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {hasPendingApprovals() && (
                                        <TooltipContent>
                                            <p>Resolva todas as alterações pendentes antes de editar novamente</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    {isEditMode ? (
                        <div className="space-y-8">
                            {educationFormFields.map(field => (
                                <div key={field.id} className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none">
                                    {/* <div className="border-b border-gray-200 pb-2 mb-4">
                                        <span className="font-raleway font-bold text-lg">
                                            {field.label.split('. ')[0]}
                                        </span>
                                    </div> */}
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(processSubmit)} id="education-form">
                            <div className="space-y-8">
                                {educationFormFields.map(field => (
                                    <div key={field.id} className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none mb-6">
                                        <div className="border-b border-gray-200 pb-2 mb-4">
                                            <span className="font-raleway font-bold text-lg">{field.label.split('. ')[0]}</span>
                                        </div>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </form>
                    )}
                </div>
                <div className="flex justify-between my-4">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting || isSubmittingBatch}
                    >
                        Voltar
                    </Button>

                    {!isEditMode && (
                        <Button
                            type="submit"
                            form="education-form"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}