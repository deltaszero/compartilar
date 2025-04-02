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
    extracurricular: RadioQuestion<'sim' | 'não'>;
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
    uniform: {
      payment: {
        id: 'uniform.payment',
        type: 'radio',
        label: 'Quem arcará com os custos de fardamento?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'uniform.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'uniform.payment',
          value: 'dividido'
        }
      }
    },
    books: {
      payment: {
        id: 'books.payment',
        type: 'radio',
        label: 'Quem arcará com os custos de apostilas?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'books.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'books.payment',
          value: 'dividido'
        }
      }
    },
    extraActivities: {
      payment: {
        id: 'extraActivities.payment',
        type: 'radio',
        label: 'Quem arcará com os custos de atividades extras propostas pela escola?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'extraActivities.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'extraActivities.payment',
          value: 'dividido'
        }
      }
    },
    fieldTrips: {
      payment: {
        id: 'fieldTrips.payment',
        type: 'radio',
        label: 'Quem arcará com os custos de excursões?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'fieldTrips.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'fieldTrips.payment',
          value: 'dividido'
        }
      }
    },
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
    schoolTransport: {
      id: 'schoolTransport',
      type: 'radio',
      label: 'Se for necessária a contratação de transporte escolar, quem arcará com os custos?',
      options: [
        { value: 'pai', label: 'Pai' },
        { value: 'mãe', label: 'Mãe' }
      ],
      required: true
    },
    privateTutor: {
      decision: {
        id: 'privateTutor.decision',
        type: 'radio',
        label: 'Se for preciso contratar um professor particular, quem decidirá?',
        options: [
          { value: 'conjunto', label: 'Em conjunto' },
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' }
        ],
        required: true
      },
      payment: {
        id: 'privateTutor.payment',
        type: 'radio',
        label: 'Quem será responsável pelo pagamento?',
        options: [
          { value: 'pai', label: 'Pai' },
          { value: 'mãe', label: 'Mãe' },
          { value: 'dividido', label: 'Será dividido' }
        ],
        required: true
      },
      percentage: {
        id: 'privateTutor.percentage',
        type: 'text',
        label: 'Porcentagem de divisão',
        placeholder: 'Ex: 50%',
        required: false,
        conditionalOn: {
          field: 'privateTutor.payment',
          value: 'dividido'
        }
      }
    },
    familyAccess: {
      transport: {
        id: 'familyAccess.transport',
        type: 'radio',
        label: 'Família extensa está autorizada a transportar o menor?',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      signDocuments: {
        id: 'familyAccess.signDocuments',
        type: 'radio',
        label: 'Família extensa pode assinar documentos na escola?',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      extracurricular: {
        id: 'familyAccess.extracurricular',
        type: 'radio',
        label: 'E nas atividades extracurriculares?',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      }
    },
    schoolEvents: {
      id: 'schoolEvents',
      type: 'radio',
      label: 'Em festas escolares, os genitores:',
      options: [
        { value: 'ambos', label: 'Ambos participarão sempre' },
        { value: 'revezamento', label: 'Se revezarão (participando somente nas atividades em sua homenagem e revezando-se anualmente)' }
      ],
      required: true
    },
  }
};
