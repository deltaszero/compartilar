export interface ParentalPlan {
    id: string;
    title: string;
    created_at: number;
    updated_at: number;
    childrenIds: string[]; // Array of child IDs (minimum one)
    editors: string[]; // Array of editor IDs (minimum one)
    viewers: string[];
    created_by: string;
    sections?: {
        general?: GeneralSection;
        education?: EducationSection;
        extracurricular?: ExtracurricularSection;
        extras?: ExtrasSection;
        screens?: ScreensSection;
        religion?: ReligionSection;
        travel?: TravelSection;
        health?: HealthSection;
        support?: SupportSection;
        coexistence?: CoexistenceSection;
        consequences?: ConsequencesSection;
        [key: string]: any; // Add index signature for dynamic access
    };
    // Allow camelCase variants too for compatibility
    createdAt?: string | number;
    updatedAt?: string | number;
    createdBy?: string;
    // Collection-specific fields
    isLocked?: boolean; // Flag to indicate if the entire plan is locked
    isDeleted?: boolean; // Flag to indicate if the plan is soft-deleted
    status?: 'active' | 'archived'; // Status of the plan
}

export interface FieldStatus {
    value: string; // Current value
    previousValue?: string; // Previous value for rollback
    status: 'approved' | 'pending' | 'disagreed'; // Status of the field
    isLocked?: boolean; // Flag to indicate if the field is locked for editing
    lastUpdatedBy: string; // ID of user who made the last change
    lastUpdatedAt: number; // Timestamp of the last change
    approvedBy?: string; // ID of user who approved/rejected (if applicable)
    approvedAt?: number; // Timestamp of approval/rejection (if applicable)
    comments?: string; // Comments for approval/rejection
}

export interface ChangelogEntry {
    id?: string;
    planId: string;
    timestamp: number;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'approve_field' | 'reject_field' | 'cancel_field_change';
    description: string;
    fieldsBefore?: Record<string, any>;
    fieldsAfter?: Record<string, any>;
    fieldName?: string; // Name of the field that was changed
    section?: string; // Name of the section containing the field
}

export interface PendingChangeNotification {
    id?: string;
    planId: string;
    fieldName: string;
    section: string;
    timestamp: number;
    requestedBy: string;
    targetUsers: string[]; // Users who need to approve
    status: 'pending' | 'approved' | 'rejected' | 'canceled';
    read: boolean;
}

export interface GeneralSection {
    reference_home: string | FieldStatus; // Can be editor IDs or 'alternado'
    guardianship_type: 'unilateral' | 'compartilhada' | FieldStatus;
    
    // Child support for employed parent
    employed_money_payment: 'sim' | 'não' | FieldStatus;
    employed_payment_method?: 'depósito' | 'desconto_em_folha' | FieldStatus;
    employed_direct_payment: 'sim' | 'não' | FieldStatus;
    employed_services_payment: 'sim' | 'não' | FieldStatus;
    employed_extra_expenses: 'sim' | 'não' | FieldStatus;
    
    // Child support for unemployed parent
    unemployed_money_payment: 'sim' | 'não' | FieldStatus;
    unemployed_payment_method?: 'depósito' | 'desconto_em_folha' | FieldStatus;
    unemployed_direct_payment: 'sim' | 'não' | FieldStatus;
    unemployed_services_payment: 'sim' | 'não' | FieldStatus;
    unemployed_extra_expenses: 'sim' | 'não' | FieldStatus;
}

export interface EducationSection {
    school: string | FieldStatus;
    tuition_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    tuition_percentage?: string | FieldStatus;

    supplies_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    supplies_percentage?: string | FieldStatus;

    uniform_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    uniform_percentage?: string | FieldStatus;

    books_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    books_percentage?: string | FieldStatus;

    activities_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    activities_percentage?: string | FieldStatus;

    excursions_responsible: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    excursions_percentage?: string | FieldStatus;

    emergency_contact: string | 'outro' | FieldStatus; // Editor ID or 'outro'
    emergency_who?: string | FieldStatus;

    transport_responsible: string | FieldStatus; // Editor ID

    tutor_decision: 'conjunto' | string | FieldStatus; // 'conjunto' or editor ID
    tutor_payment: string | 'dividido' | FieldStatus; // Editor ID or 'dividido'
    tutor_percentage?: string | FieldStatus;

    extended_family_school: 'sim' | 'nao' | FieldStatus;
    extended_family_activities: 'sim' | 'nao' | FieldStatus;

    school_events: 'ambos' | 'revezamento' | FieldStatus;
}

export interface ExtracurricularSection {
    // To be implemented later
}

export interface ExtrasSection {
    // To be implemented later
}

export interface ScreensSection {
    // To be implemented later
}

export interface ReligionSection {
    // To be implemented later
}

export interface TravelSection {
    // To be implemented later
}

export interface HealthSection {
    // To be implemented later
}

export interface SupportSection {
    // To be implemented later
}

export interface CoexistenceSection {
    // To be implemented later
}

export interface ConsequencesSection {
    // To be implemented later
}

export interface Section {
    id: string;
    title: string;
    route: string;
    completed: boolean;
    imagePath?: string;
}

export const planSections: Section[] = [
    {
        id: 'general',
        title: 'Informações Gerais',
        route: 'guarda',
        completed: false,
        imagePath: '/app/assets/images/plan_01.webp'
    },
    {
        id: 'education',
        title: 'Educação Regular',
        route: 'educacao',
        completed: false,
        imagePath: '/app/assets/images/plan_02.webp'
    },
    {
        id: 'extracurricular',
        title: 'Atividades Extracurriculares',
        route: 'atividades',
        completed: false,
        imagePath: '/app/assets/images/plan_03.webp'
    },
    {
        id: 'extras',
        title: 'Convites & Gastos Extras',
        route: 'convites',
        completed: false,
        imagePath: '/app/assets/images/plan_04.webp'
    },
    {
        id: 'screens',
        title: 'Uso de Telas & Redes Sociais',
        route: 'telas',
        completed: false,
        imagePath: '/app/assets/images/plan_05.webp'
    },
    {
        id: 'religion',
        title: 'Religião',
        route: 'religiao',
        completed: false,
        imagePath: '/app/assets/images/plan_06.webp'
    },
    {
        id: 'travel',
        title: 'Viagens',
        route: 'viagens',
        completed: false,
        imagePath: '/app/assets/images/plan_07.webp'
    },
    {
        id: 'health',
        title: 'Saúde',
        route: 'saude',
        completed: false,
        imagePath: '/app/assets/images/plan_08.webp'
    },
    {
        id: 'support',
        title: 'Rede de Apoio Terceirizada',
        route: 'apoio',
        completed: false,
        imagePath: '/app/assets/images/plan_09.webp'
    },
    {
        id: 'coexistence',
        title: 'Convivência',
        route: 'convivencia',
        completed: false,
        imagePath: '/app/assets/images/plan_10.webp'
    },
    {
        id: 'consequences',
        title: 'Consequências pelo Descumprimento',
        route: 'consequencias',
        completed: false,
        imagePath: '/app/assets/images/plan_11.webp'
    }
];