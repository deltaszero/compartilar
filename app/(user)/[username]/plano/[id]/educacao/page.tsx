'use client';

import { useState, use } from 'react';
import { usePlan } from '../context';
import { EducationSection } from '../../types';
import { updateEducationSection } from '../../services/plan-service';
import { useUser } from '@/context/userContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import RegularEducationForm from '../../components/RegularEducationForm';
import { regularEducationInitialValues } from '../../data/regularEducationFormData';

export default function EducationPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error, refreshPlan } = usePlan();
  const { user } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating education section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render a field value from the education data
  const renderFieldValue = (label: string, value: string | undefined, fallback = "Não informado") => {
    return (
      <div className="mb-4">
        <h3 className="font-medium text-gray-700">{label}</h3>
        <p className="text-gray-900">{value || fallback}</p>
      </div>
    );
  };

  // Helper to render a radio field's selected option
  const renderRadioSelection = (label: string, value: string | undefined, options: Record<string, string>, fallback = "Não informado") => {
    return (
      <div className="mb-4">
        <h3 className="font-medium text-gray-700">{label}</h3>
        <p className="text-gray-900">{value ? options[value] : fallback}</p>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="p-8">
        <Button 
          variant="default" 
          className="mb-4"
          onClick={() => setIsEditing(false)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <RegularEducationForm 
          initialData={educationData}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // Options mapping for radio selections
  const responsibleOptions = {
    'pai': 'Pai',
    'mae': 'Mãe',
    'publica': 'Escola pública',
    'dividido': 'Dividido',
    'conjunto': 'Em conjunto',
  };

  const yesNoOptions = {
    'sim': 'Sim',
    'nao': 'Não',
  };

  const eventsOptions = {
    'ambos': 'Ambos participarão sempre',
    'revezamento': 'Se revezarão',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Educação Regular</h1>
        <Button onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Informações Escolares</CardTitle>
          <CardDescription>
            Detalhes sobre a educação escolar da criança
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderFieldValue("Escola", educationData.school)}
            {renderRadioSelection(
              "Responsável pelo pagamento das mensalidades", 
              educationData.tuition_responsible, 
              responsibleOptions
            )}
            {renderRadioSelection(
              "Responsável pelos custos de material escolar", 
              educationData.supplies_responsible, 
              responsibleOptions
            )}
            {educationData.supplies_responsible === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (material escolar)", educationData.supplies_percentage)}
            {renderRadioSelection(
              "Responsável pelos custos de fardamento", 
              educationData.uniform_responsible, 
              responsibleOptions
            )}
            {educationData.uniform_responsible === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (fardamento)", educationData.uniform_percentage)}
            {renderRadioSelection(
              "Responsável pelos custos de apostilas", 
              educationData.books_responsible, 
              responsibleOptions
            )}
            {educationData.books_responsible === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (apostilas)", educationData.books_percentage)}
          </div>
          <div>
            {renderRadioSelection(
              "Responsável pelos custos de atividades extras propostas pela escola", 
              educationData.activities_responsible, 
              responsibleOptions
            )}
            {educationData.activities_responsible === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (atividades extras)", educationData.activities_percentage)}
            {renderRadioSelection(
              "Responsável pelos custos de excursões", 
              educationData.excursions_responsible, 
              responsibleOptions
            )}
            {educationData.excursions_responsible === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (excursões)", educationData.excursions_percentage)}
            {renderRadioSelection(
              "Contato em caso de emergência", 
              educationData.emergency_contact, 
              {...responsibleOptions, 'outro': 'Outro'}
            )}
            {educationData.emergency_contact === 'outro' && 
              renderFieldValue("Quem contatar em emergências", educationData.emergency_who)}
            {renderRadioSelection(
              "Responsável pelos custos de transporte escolar", 
              educationData.transport_responsible, 
              responsibleOptions
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderRadioSelection(
              "Quem decidirá sobre professor particular", 
              educationData.tutor_decision, 
              responsibleOptions
            )}
            {renderRadioSelection(
              "Responsável pelo pagamento de professor particular", 
              educationData.tutor_payment, 
              responsibleOptions
            )}
            {educationData.tutor_payment === 'dividido' && 
              renderFieldValue("Porcentagem de divisão (professor particular)", educationData.tutor_percentage)}
          </div>
          <div>
            {renderRadioSelection(
              "Família extensa autorizada a transportar o menor ou assinar documentos na escola", 
              educationData.extended_family_school, 
              yesNoOptions
            )}
            {renderRadioSelection(
              "Família extensa autorizada nas atividades extracurriculares", 
              educationData.extended_family_activities, 
              yesNoOptions
            )}
            {renderRadioSelection(
              "Em festas escolares, os genitores", 
              educationData.school_events, 
              eventsOptions
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}