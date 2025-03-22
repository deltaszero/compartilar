'use client';

import { useState, use, useEffect } from 'react';
import { usePlan } from '../context';
import { EducationSection } from '../../types';
import { updateEducationSection } from '../../services/plan-service';
import { useUser } from '@/context/userContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, BookOpen, School, Briefcase, Users, PhoneCall, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { educationFormFields } from '../../data/regularEducationFormData';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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

// Field component for modularity
const FormField = ({ field, register, watch, formState, educationData }: any) => {
  const watchedValues = watch();
  
  switch (field.type) {
    case 'text':
      return (
        <div className="mb-4" key={field.id}>
          <Label htmlFor={field.id} className="block mb-2 text-sm sm:text-base font-medium">{field.label}</Label>
          <Input
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            className="w-full"
            {...register(field.name as keyof EducationSection, { required: field.required })}
          />
          {formState.errors[field.name as keyof EducationSection] && (
            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
          )}
        </div>
      );
    case 'radio':
      return (
        <div className="mb-6" key={field.id}>
          <Label className="block mb-2 text-sm sm:text-base font-medium">{field.label}</Label>
          <RadioGroup
            defaultValue={educationData?.[field.name as keyof EducationSection] as string}
            className="space-y-2"
            {...register(field.name as keyof EducationSection, { required: field.required })}
          >
            {field.options.map((option: any) => (
              <div className="flex items-center space-x-2" key={option.id}>
                <RadioGroupItem
                  value={option.value}
                  id={option.id}
                  {...register(field.name as keyof EducationSection)}
                />
                <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {formState.errors[field.name as keyof EducationSection] && (
            <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
          )}
          
          {/* Render conditional field if needed */}
          {field.conditionalField && 
            watchedValues[field.conditionalField.showIf as keyof EducationSection] === field.conditionalField.equals && (
              <div className="mt-2 ml-4 pl-2 border-l-2 border-gray-200">
                <Label htmlFor={field.conditionalField.field.id} className="block mb-2 text-sm">
                  {field.conditionalField.field.label}
                </Label>
                <Input
                  id={field.conditionalField.field.id}
                  type="text"
                  placeholder={field.conditionalField.field.placeholder}
                  className="w-full"
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

export default function EducationPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error, refreshPlan } = usePlan();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    if (plan?.sections?.education && Object.keys(formState.dirtyFields).length > 0) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [watch(), plan, formState.dirtyFields]);

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

  const handleFormSubmitLocal = async (data: EducationSection) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await updateEducationSection(resolvedParams.id, user.uid, data);
      await refreshPlan();
      setHasChanges(false);
      toast({
        title: 'Sucesso',
        description: 'Informações atualizadas',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating education section:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get fields for a specific category
  const getCategoryFields = (categoryId: string) => {
    const category = formCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return educationFormFields.filter(field => 
      category.fields.includes(field.name) || 
      (field.conditionalField && category.fields.includes(field.conditionalField.field.name))
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Educação Regular</h1>
        {hasChanges && (
          <Button 
            onClick={handleSubmit(handleFormSubmitLocal)}
            disabled={isSubmitting}
            className="bg-main hover:bg-main/90 w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </div>
      
      <form onSubmit={handleSubmit(handleFormSubmitLocal)} id="education-form" className="space-y-6">
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
                  <FormField 
                    key={field.id}
                    field={field}
                    register={register}
                    watch={watch}
                    formState={formState}
                    educationData={educationData}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {hasChanges && (
          <div className="sticky bottom-0 bg-background p-4 border-t border-gray-200 rounded-lg shadow-lg mt-6">
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-main hover:bg-main/90 w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}