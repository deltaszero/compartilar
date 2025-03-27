'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { educationFormFields, regularEducationInitialValues } from '../data/regularEducationFormData';
import { EducationSection, FieldStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

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
    isEditMode = false
}: RegularEducationFormProps) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<EducationSection>({
        defaultValues: initialData
    });
    const { toast } = useToast();
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editFieldValue, setEditFieldValue] = useState<string>('');
    const [approvalComments, setApprovalComments] = useState<string>('');

    // Watch form values to handle conditional fields
    const watchedValues = watch();

    const processSubmit = async (data: EducationSection) => {
        try {
            await onSubmit(data);
            toast({
                title: "Sucesso",
                description: "Informações de educação salvas com sucesso.",
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao salvar as informações.",
                variant: "destructive",
            });
        }
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
            await onFieldChange(editingField, editFieldValue);
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

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.id}>
                        <div className="flex items-center justify-between">
                            <Label htmlFor={field.id} className="block mb-2">
                                {getFieldStatusBadge(fieldData)}
                                {field.label.split('. ').slice(1).join('. ')}
                            </Label>

                            {isEditMode && (
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
                                disabled={isEditMode && !canEdit} // Only disable if in edit mode AND user can't edit
                                readOnly={isEditMode && !canEdit} // For better UI feedback
                                {...(!isEditMode ? register(fieldName, { required: field.required }) : {})}
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
                        <div className="flex items-center justify-between">
                            <Label className="block mb-2">
                                {field.label.split('. ').slice(1).join('. ')}
                                {getFieldStatusBadge(fieldData)}
                            </Label>

                            {isEditMode && (
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

                        {editingField === fieldName ? (
                            <div className="space-y-2">
                                <RadioGroup
                                    value={editFieldValue}
                                    onValueChange={setEditFieldValue}
                                >
                                    {field.options.map((option: any) => (
                                        <div className="flex items-center space-x-2 mb-1" key={option.id}>
                                            <RadioGroupItem
                                                value={option.value}
                                                id={`editing-${option.id}`}
                                            />
                                            <Label htmlFor={`editing-${option.id}`}>{option.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
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
                            <RadioGroup
                                defaultValue={displayValue}
                                disabled={isEditMode && !canEdit}
                                {...(!isEditMode ? register(fieldName, { required: field.required }) : {})}
                            >
                                {field.options.map((option: any) => (
                                    <div className="flex items-center space-x-2 mb-1" key={option.id}>
                                        <RadioGroupItem
                                            value={option.value}
                                            id={option.id}
                                            disabled={isEditMode && !canEdit}
                                            {...(!isEditMode ? register(fieldName) : {})}
                                        />
                                        <Label htmlFor={option.id}>{option.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
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

                        {/* Render conditional field if needed */}
                        {field.conditionalField &&
                            watchedValues[field.conditionalField.showIf as keyof EducationSection] === field.conditionalField.equals && (
                                <div className="ml-6 mt-2">
                                    <Label htmlFor={field.conditionalField.field.id} className="block mb-2">
                                        {field.conditionalField.field.label}
                                    </Label>
                                    <Input
                                        id={field.conditionalField.field.id}
                                        type="text"
                                        placeholder={field.conditionalField.field.placeholder}
                                        disabled={isEditMode && !canEdit}
                                        {...(!isEditMode ? register(field.conditionalField.field.name as keyof EducationSection) : {})}
                                    />
                                </div>
                            )
                        }
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <TooltipProvider>
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Educação Regular</CardTitle>
                    <CardDescription>
                        {isEditMode
                            ? "Visualize e solicite alterações nas informações sobre a educação escolar da criança"
                            : "Preencha as informações sobre a educação escolar da criança"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isEditMode ? (
                        <div className="space-y-8">
                            {educationFormFields.map(field => (
                                <div key={field.id} className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none mb-6">
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
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
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
                </CardFooter>
            </Card>
        </TooltipProvider>
    );
}