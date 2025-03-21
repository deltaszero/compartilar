// This file contains the form field definitions for the Regular Education section
// of the parental plan. The form component will read this data to render the fields dynamically.

import { z } from 'zod';

// Form validation schema - exported for use in the form component
export const educationFormSchema = z.object({
  school: z.string().min(1, { message: 'O nome da escola é obrigatório' }),
  tuitionResponsible: z.enum(['pai', 'mae', 'publica'], {
    required_error: 'Selecione o responsável pelo pagamento das mensalidades',
  }),
  
  // School supplies
  suppliesResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo material escolar',
  }),
  suppliesPercentage: z.string().optional(),
  
  // Uniform
  uniformResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo fardamento',
  }),
  uniformPercentage: z.string().optional(),
  
  // Books
  booksResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas apostilas',
  }),
  booksPercentage: z.string().optional(),
  
  // Extra activities
  activitiesResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas atividades extras',
  }),
  activitiesPercentage: z.string().optional(),
  
  // Excursions
  excursionsResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas excursões',
  }),
  excursionsPercentage: z.string().optional(),
  
  // Emergency contact
  emergencyContact: z.enum(['pai', 'mae', 'outro'], {
    required_error: 'Selecione o contato de emergência',
  }),
  emergencyWho: z.string().optional(),
  
  // School transport
  transportResponsible: z.enum(['pai', 'mae'], {
    required_error: 'Selecione o responsável pelo transporte escolar',
  }),
  
  // Private tutor
  tutorDecision: z.enum(['conjunto', 'pai', 'mae'], {
    required_error: 'Selecione quem decidirá sobre a contratação de professor particular',
  }),
  tutorPayment: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo pagamento do professor particular',
  }),
  tutorPercentage: z.string().optional(),
  
  // Extended family authorization
  extendedFamilySchool: z.enum(['sim', 'nao'], {
    required_error: 'Selecione se a família extensa está autorizada na escola',
  }),
  extendedFamilyActivities: z.enum(['sim', 'nao'], {
    required_error: 'Selecione se a família extensa está autorizada nas atividades',
  }),
  
  // School events participation
  schoolEvents: z.enum(['ambos', 'revezamento'], {
    required_error: 'Selecione como será a participação dos genitores em eventos escolares',
  }),
});

// Type definition for form values
export type EducationFormValues = z.infer<typeof educationFormSchema>;

// Default values for the form
export const defaultEducationFormValues: EducationFormValues = {
  school: '',
  tuitionResponsible: 'pai',
  suppliesResponsible: 'pai',
  uniformResponsible: 'pai',
  booksResponsible: 'pai',
  activitiesResponsible: 'pai',
  excursionsResponsible: 'pai',
  emergencyContact: 'pai',
  transportResponsible: 'pai',
  tutorDecision: 'conjunto',
  tutorPayment: 'pai',
  extendedFamilySchool: 'nao',
  extendedFamilyActivities: 'nao',
  schoolEvents: 'ambos',
  // Optional fields with default empty values
  suppliesPercentage: '',
  uniformPercentage: '',
  booksPercentage: '',
  activitiesPercentage: '',
  excursionsPercentage: '',
  emergencyWho: '',
  tutorPercentage: '',
};

// Form field configuration array - this defines the structure of the form
export const regularEducationFormFields = [
  {
    id: "school",
    fieldType: "text",
    label: "1.1. Em que escola o menor estuda:",
    required: true,
  },
  {
    id: "tuitionResponsible",
    fieldType: "radio",
    label: "1.2. Quem será o responsável financeiro pelo pagamento das mensalidades?",
    required: true,
    options: [
      { id: "pai_option", value: "pai", label: "Pai" },
      { id: "mae_option", value: "mae", label: "Mãe" },
      { id: "publica_option", value: "publica", label: "Escola pública" }
    ]
  },
  {
    id: "costsSection",
    fieldType: "section",
    label: "1.3. Quem arcará com os custos de:",
    fields: [
      {
        id: "suppliesResponsible",
        fieldType: "radio",
        label: "- Material escolar",
        required: true,
        options: [
          { id: "pai_option", value: "pai", label: "Pai" },
          { id: "mae_option", value: "mae", label: "Mãe" },
          { id: "dividido_option", value: "dividido", label: "Será dividido" }
        ]
      },
      {
        id: "suppliesPercentage",
        fieldType: "text",
        label: "Em que porcentagem?",
        placeholder: "Ex: Pai 70%, Mãe 30%",
        required: false,
        showWhen: { field: "suppliesResponsible", value: "dividido" }
      },
      {
        id: "uniformResponsible",
        fieldType: "radio",
        label: "- Fardamento",
        required: true,
        options: [
          { id: "pai_option", value: "pai", label: "Pai" },
          { id: "mae_option", value: "mae", label: "Mãe" },
          { id: "dividido_option", value: "dividido", label: "Será dividido" }
        ]
      },
      {
        id: "uniformPercentage",
        fieldType: "text",
        label: "Em que porcentagem?",
        placeholder: "Ex: Pai 70%, Mãe 30%",
        required: false,
        showWhen: { field: "uniformResponsible", value: "dividido" }
      },
      {
        id: "booksResponsible",
        fieldType: "radio",
        label: "- Apostilas",
        required: true,
        options: [
          { id: "pai_option", value: "pai", label: "Pai" },
          { id: "mae_option", value: "mae", label: "Mãe" },
          { id: "dividido_option", value: "dividido", label: "Será dividido" }
        ]
      },
      {
        id: "booksPercentage",
        fieldType: "text",
        label: "Em que porcentagem?",
        placeholder: "Ex: Pai 70%, Mãe 30%",
        required: false,
        showWhen: { field: "booksResponsible", value: "dividido" }
      },
      {
        id: "activitiesResponsible",
        fieldType: "radio",
        label: "- Atividades Extras propostas pela escola",
        required: true,
        options: [
          { id: "pai_option", value: "pai", label: "Pai" },
          { id: "mae_option", value: "mae", label: "Mãe" },
          { id: "dividido_option", value: "dividido", label: "Será dividido" }
        ]
      },
      {
        id: "activitiesPercentage",
        fieldType: "text",
        label: "Em que porcentagem?",
        placeholder: "Ex: Pai 70%, Mãe 30%",
        required: false,
        showWhen: { field: "activitiesResponsible", value: "dividido" }
      },
      {
        id: "excursionsResponsible",
        fieldType: "radio",
        label: "- Excursões",
        required: true,
        options: [
          { id: "pai_option", value: "pai", label: "Pai" },
          { id: "mae_option", value: "mae", label: "Mãe" },
          { id: "dividido_option", value: "dividido", label: "Será dividido" }
        ]
      },
      {
        id: "excursionsPercentage",
        fieldType: "text",
        label: "Em que porcentagem?",
        placeholder: "Ex: Pai 70%, Mãe 30%",
        required: false,
        showWhen: { field: "excursionsResponsible", value: "dividido" }
      }
    ]
  },
  {
    id: "emergencyContact",
    fieldType: "radio",
    label: "1.4. Quem a escola deverá contatar em caso de emergência?",
    required: true,
    options: [
      { id: "pai_option", value: "pai", label: "Pai" },
      { id: "mae_option", value: "mae", label: "Mãe" },
      { id: "outro_option", value: "outro", label: "Outro" }
    ]
  },
  {
    id: "emergencyWho",
    fieldType: "text",
    label: "Quem?",
    required: false,
    showWhen: { field: "emergencyContact", value: "outro" }
  },
  {
    id: "transportResponsible",
    fieldType: "radio",
    label: "1.5. Se for necessária a contratação de transporte escolar, quem arcará com os custos?",
    required: true,
    options: [
      { id: "pai_option", value: "pai", label: "Pai" },
      { id: "mae_option", value: "mae", label: "Mãe" }
    ]
  },
  {
    id: "tutorDecision",
    fieldType: "radio",
    label: "1.6. Se for preciso contratar um professor particular, quem decidirá?",
    required: true,
    options: [
      { id: "conjunto_option", value: "conjunto", label: "Em conjunto" },
      { id: "pai_option", value: "pai", label: "Pai" },
      { id: "mae_option", value: "mae", label: "Mãe" }
    ]
  },
  {
    id: "tutorPayment",
    fieldType: "radio",
    label: "- Quem será responsável pelo pagamento?",
    required: true,
    options: [
      { id: "pai_option", value: "pai", label: "Pai" },
      { id: "mae_option", value: "mae", label: "Mãe" },
      { id: "dividido_option", value: "dividido", label: "Será dividido" }
    ]
  },
  {
    id: "tutorPercentage",
    fieldType: "text",
    label: "Em que porcentagem?",
    placeholder: "Ex: Pai 70%, Mãe 30%",
    required: false,
    showWhen: { field: "tutorPayment", value: "dividido" }
  },
  {
    id: "extendedFamilySchool",
    fieldType: "radio",
    label: "1.7. No que se refere à família extensa (avós, tios, madrastas, padrastos), eles estão autorizados a transportar o menor ou assinar documentos na escola?",
    required: true,
    options: [
      { id: "sim_option", value: "sim", label: "Sim" },
      { id: "nao_option", value: "nao", label: "Não" }
    ]
  },
  {
    id: "extendedFamilyActivities",
    fieldType: "radio",
    label: "- E nas atividades extracurriculares?",
    required: true,
    options: [
      { id: "sim_option", value: "sim", label: "Sim" },
      { id: "nao_option", value: "nao", label: "Não" }
    ]
  },
  {
    id: "schoolEvents",
    fieldType: "radio",
    label: "1.8. Em festas escolares, os genitores:",
    required: true,
    options: [
      { id: "ambos_option", value: "ambos", label: "Ambos participarão sempre" },
      { id: "revezamento_option", value: "revezamento", label: "Se revezarão (participando somente nas atividades em sua homenagem e revezando-se anualmente naquelas que o protagonista é a criança)" }
    ]
  }
];

// Type for our form field configuration
export interface FormFieldOption {
  id: string;
  value: string;
  label: string;
}

export interface FormFieldConditional {
  field: string;
  value: string;
}

export interface FormField {
  id: string;
  fieldType: "text" | "radio" | "checkbox" | "section";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  showWhen?: FormFieldConditional;
  fields?: FormField[]; // For section fields that contain sub-fields
}