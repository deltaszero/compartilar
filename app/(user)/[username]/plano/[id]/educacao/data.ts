import { FieldQuestion, RadioQuestion, TextQuestion, FormSection } from '../../components/forms';

export interface EducationFormData {
  schoolName: TextQuestion;
  tuitionResponsible: RadioQuestion<'pai' | 'mãe' | 'escola_pública'>;
  schoolMaterial: {
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  uniform: {
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  books: {
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  extraActivities: {
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  fieldTrips: {
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  emergencyContact: RadioQuestion<'pai' | 'mãe' | 'outro'>;
  otherContactName?: TextQuestion;
  schoolTransport: RadioQuestion<'pai' | 'mãe'>;
  privateTutor: {
    decision: RadioQuestion<'conjunto' | 'pai' | 'mãe'>;
    payment: RadioQuestion<'pai' | 'mãe' | 'dividido'>;
    percentage?: TextQuestion;
  };
  familyAccess: {
    transport: RadioQuestion<'sim' | 'não'>;
    signDocuments: RadioQuestion<'sim' | 'não'>;
  };
  schoolEvents: RadioQuestion<'ambos' | 'revezamento'>;
  newFamilyParticipation: RadioQuestion<'sim' | 'não'>;
}

export const educationFormData: FormSection<EducationFormData> = {
  id: 'educacao',
  title: 'Educação Regular',
  description: 'Definição das regras relacionadas à educação formal da criança.',
  questions: {
    schoolName: {
      id: 'schoolName',
      type: 'text',
      label: 'Em que escola o menor estuda',
      placeholder: 'Nome da escola',
      required: true
    },
    tuitionResponsible: {
      id: 'tuitionResponsible',
      type: 'radio',
      label: 'Quem será o responsável financeiro pelo pagamento das mensalidades?',
      options: [
        { value: 'pai', label: 'Pai' },
        { value: 'mãe', label: 'Mãe' },
        { value: 'escola_pública', label: 'Escola pública' }
      ],
      required: true
    },
    schoolMaterial: {
      payment: {
        id: 'schoolMaterial.payment',
        type: 'radio',
        label: 'Quem arcará com os custos de material escolar?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'schoolMaterial.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'schoolMaterial.payment',
          value: 'dividido'
        }
      }
    },
    // Similar structure for uniform, books, extraActivities, fieldTrips
    // ...
    emergencyContact: {
      id: 'emergencyContact',
      type: 'radio',
      label: 'Quem a escola deverá contatar em caso de emergência?',
      options: [
        { value: 'pai', label: 'Pai' },
        { value: 'mãe', label: 'Mãe' },
        { value: 'outro', label: 'Outro' }
      ],
      required: true
    },
    otherContactName: {
      id: 'otherContactName',
      type: 'text',
      label: 'Nome do contato alternativo',
      placeholder: 'Nome completo',
      required: false,
      conditionalOn: {
        field: 'emergencyContact',
        value: 'outro'
      }
    },
    // Continue with the rest of the fields from the README
    // ...
  }
};
