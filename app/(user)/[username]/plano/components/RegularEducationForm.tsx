'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { educationFormFields, regularEducationInitialValues } from '../data/regularEducationFormData';
import { EducationSection } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface RegularEducationFormProps {
  initialData?: EducationSection;
  onSubmit: (data: EducationSection) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function RegularEducationForm({
  initialData = regularEducationInitialValues,
  onSubmit,
  onCancel,
  isSubmitting
}: RegularEducationFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EducationSection>({ 
    defaultValues: initialData 
  });
  const { toast } = useToast();
  
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

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="mb-4" key={field.id}>
            <Label htmlFor={field.id} className="block mb-2">{field.label}</Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              {...register(field.name as keyof EducationSection, { required: field.required })}
            />
            {errors[field.name as keyof EducationSection] && (
              <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
            )}
          </div>
        );
      case 'radio':
        return (
          <div className="mb-6" key={field.id}>
            <Label className="block mb-2">{field.label}</Label>
            <RadioGroup
              defaultValue={initialData[field.name as keyof EducationSection] as string}
              {...register(field.name as keyof EducationSection, { required: field.required })}
            >
              {field.options.map((option: any) => (
                <div className="flex items-center space-x-2 mb-1" key={option.id}>
                  <RadioGroupItem
                    value={option.value}
                    id={option.id}
                    {...register(field.name as keyof EducationSection)}
                  />
                  <Label htmlFor={option.id}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors[field.name as keyof EducationSection] && (
              <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
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
                    {...register(field.conditionalField.field.name as keyof EducationSection)}
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Educação Regular</CardTitle>
        <CardDescription>
          Preencha as informações sobre a educação escolar da criança
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(processSubmit)} id="education-form">
          <div className="space-y-6">
            {educationFormFields.map(renderField)}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          form="education-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </CardFooter>
    </Card>
  );
}