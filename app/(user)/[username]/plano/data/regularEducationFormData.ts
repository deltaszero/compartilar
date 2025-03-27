import { EducationSection } from '../types';

export const regularEducationInitialValues: EducationSection = {
    school: '',
    tuition_responsible: 'pai',
    supplies_responsible: 'pai',
    supplies_percentage: '',
    uniform_responsible: 'pai',
    uniform_percentage: '',
    books_responsible: 'pai',
    books_percentage: '',
    activities_responsible: 'pai',
    activities_percentage: '',
    excursions_responsible: 'pai',
    excursions_percentage: '',
    emergency_contact: 'pai',
    emergency_who: '',
    transport_responsible: 'pai',
    tutor_decision: 'conjunto',
    tutor_payment: 'pai',
    tutor_percentage: '',
    extended_family_school: 'nao',
    extended_family_activities: 'nao',
    school_events: 'ambos'
};

export const educationFormFields = [
    {
        id: 'school',
        label: '1.1. Qual o nome da escola que a criança estuda?',
        type: 'text',
        name: 'school',
        required: true,
    },
    {
        id: 'tuition-responsible',
        label: '1.2. Em caso de escola particular, quem será responsável financeiro pelo pagamento das mensalidades?',
        type: 'radio',
        name: 'tuition_responsible',
        options: [
            { id: 'tuition-father', label: 'Pai', value: 'pai' },
            { id: 'tuition-mother', label: 'Mãe', value: 'mae' },
            { id: 'tuition-public', label: 'Não se aplica', value: 'publica' }
        ],
        required: true,
    },
    {
        id: 'supplies-responsible',
        label: '1.3. Quem arcará com os custos de material escolar?',
        type: 'radio',
        name: 'supplies_responsible',
        options: [
            { id: 'supplies-father', label: 'Pai', value: 'pai' },
            { id: 'supplies-mother', label: 'Mãe', value: 'mae' },
            { id: 'supplies-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'supplies_responsible',
            equals: 'dividido',
            field: {
                id: 'supplies-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'supplies_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'uniform-responsible',
        label: '1.3. Quem arcará com os custos de fardamento?',
        type: 'radio',
        name: 'uniform_responsible',
        options: [
            { id: 'uniform-father', label: 'Pai', value: 'pai' },
            { id: 'uniform-mother', label: 'Mãe', value: 'mae' },
            { id: 'uniform-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'uniform_responsible',
            equals: 'dividido',
            field: {
                id: 'uniform-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'uniform_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'books-responsible',
        label: '1.3. Quem arcará com os custos de apostilas?',
        type: 'radio',
        name: 'books_responsible',
        options: [
            { id: 'books-father', label: 'Pai', value: 'pai' },
            { id: 'books-mother', label: 'Mãe', value: 'mae' },
            { id: 'books-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'books_responsible',
            equals: 'dividido',
            field: {
                id: 'books-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'books_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'activities-responsible',
        label: '1.3. Quem arcará com os custos de atividades extras propostas pela escola?',
        type: 'radio',
        name: 'activities_responsible',
        options: [
            { id: 'activities-father', label: 'Pai', value: 'pai' },
            { id: 'activities-mother', label: 'Mãe', value: 'mae' },
            { id: 'activities-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'activities_responsible',
            equals: 'dividido',
            field: {
                id: 'activities-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'activities_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'excursions-responsible',
        label: '1.3. Quem arcará com os custos de excursões?',
        type: 'radio',
        name: 'excursions_responsible',
        options: [
            { id: 'excursions-father', label: 'Pai', value: 'pai' },
            { id: 'excursions-mother', label: 'Mãe', value: 'mae' },
            { id: 'excursions-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'excursions_responsible',
            equals: 'dividido',
            field: {
                id: 'excursions-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'excursions_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'emergency-contact',
        label: '1.4. Quem a escola deverá contatar em caso de emergência?',
        type: 'radio',
        name: 'emergency_contact',
        options: [
            { id: 'emergency-father', label: 'Pai', value: 'pai' },
            { id: 'emergency-mother', label: 'Mãe', value: 'mae' },
            { id: 'emergency-other', label: 'Outro', value: 'outro' }
        ],
        required: true,
        conditionalField: {
            showIf: 'emergency_contact',
            equals: 'outro',
            field: {
                id: 'emergency-who',
                label: 'Quem?',
                type: 'text',
                name: 'emergency_who',
                required: false,
            }
        }
    },
    {
        id: 'transport-responsible',
        label: '1.5. Se for necessária a contratação de transporte escolar, quem arcará com os custos?',
        type: 'radio',
        name: 'transport_responsible',
        options: [
            { id: 'transport-father', label: 'Pai', value: 'pai' },
            { id: 'transport-mother', label: 'Mãe', value: 'mae' }
        ],
        required: true,
    },
    {
        id: 'tutor-decision',
        label: '1.6. Se for preciso contratar um professor particular, quem decidirá?',
        type: 'radio',
        name: 'tutor_decision',
        options: [
            { id: 'tutor-decision-together', label: 'Em conjunto', value: 'conjunto' },
            { id: 'tutor-decision-father', label: 'Pai', value: 'pai' },
            { id: 'tutor-decision-mother', label: 'Mãe', value: 'mae' }
        ],
        required: true,
    },
    {
        id: 'tutor-payment',
        label: '1.6. Quem será responsável pelo pagamento do professor particular?',
        type: 'radio',
        name: 'tutor_payment',
        options: [
            { id: 'tutor-payment-father', label: 'Pai', value: 'pai' },
            { id: 'tutor-payment-mother', label: 'Mãe', value: 'mae' },
            { id: 'tutor-payment-divided', label: 'Será dividido', value: 'dividido' }
        ],
        required: true,
        conditionalField: {
            showIf: 'tutor_payment',
            equals: 'dividido',
            field: {
                id: 'tutor-percentage',
                label: 'Em que porcentagem?',
                type: 'text',
                name: 'tutor_percentage',
                placeholder: 'Ex: Pai 70%, Mãe 30%',
                required: false,
            }
        }
    },
    {
        id: 'extended-family-school',
        label: '1.7. No que se refere à família extensa (avós, tios, madrastas, padrastos), eles estão autorizados a transportar o menor ou assinar documentos na escola?',
        type: 'radio',
        name: 'extended_family_school',
        options: [
            { id: 'extended-family-yes', label: 'Sim', value: 'sim' },
            { id: 'extended-family-no', label: 'Não', value: 'nao' }
        ],
        required: true,
    },
    {
        id: 'extended-family-activities',
        label: '1.7. E nas atividades extracurriculares?',
        type: 'radio',
        name: 'extended_family_activities',
        options: [
            { id: 'extended-family-activities-yes', label: 'Sim', value: 'sim' },
            { id: 'extended-family-activities-no', label: 'Não', value: 'nao' }
        ],
        required: true,
    },
    {
        id: 'school-events',
        label: '1.8. Em festas escolares, os genitores:',
        type: 'radio',
        name: 'school_events',
        options: [
            { id: 'school-events-both', label: 'Ambos participarão sempre', value: 'ambos' },
            { id: 'school-events-alternate', label: 'Se revezarão (participando somente nas atividades em sua homenagem e revezando-se anualmente naquelas que o protagonista é a criança)', value: 'revezamento' }
        ],
        required: true,
    }
];