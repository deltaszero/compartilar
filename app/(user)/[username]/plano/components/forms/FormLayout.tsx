import React from 'react';
import { Button } from '@/components/ui/button';
import { FormSection as FormSectionType } from './index';
import FormSection from './FormSection';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FormLayoutProps {
  sections: FormSectionType[];
  formState: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  submitLabel?: string;
  isSubmitting?: boolean;
  globalError?: string;
  isDisabled?: boolean;
  pendingApproval?: boolean;
}

const FormLayout: React.FC<FormLayoutProps> = ({
  sections,
  formState,
  onChange,
  onSubmit,
  errors = {},
  submitLabel = 'Salvar',
  isSubmitting = false,
  globalError,
  isDisabled = false,
  pendingApproval = false
}) => {
  return (
    <div className="space-y-6">
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {pendingApproval && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alterações pendentes</AlertTitle>
          <AlertDescription>
            Este plano tem alterações pendentes de aprovação. Não é possível fazer novas alterações até que as alterações pendentes sejam aprovadas ou rejeitadas.
          </AlertDescription>
        </Alert>
      )}

      {sections.map((section) => (
        <FormSection
          key={section.id}
          section={section}
          formState={formState}
          onChange={onChange}
          errors={errors}
          disabled={isDisabled}
          pending={pendingApproval}
        />
      ))}

      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || isDisabled || pendingApproval}
        >
          {isSubmitting ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default FormLayout;