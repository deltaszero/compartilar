export interface ParentalPlan {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  child_id: string;
  editors: string[];
  viewers: string[];
  created_by: string;
  sections: {
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
  };
}

export interface FieldStatus {
  value: string;
  approved: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
  comments?: string;
}

export interface EducationSection {
  school: string | FieldStatus;
  tuition_responsible: 'pai' | 'mae' | 'publica' | FieldStatus;
  
  supplies_responsible: 'pai' | 'mae' | 'dividido' | FieldStatus;
  supplies_percentage?: string | FieldStatus;
  
  uniform_responsible: 'pai' | 'mae' | 'dividido' | FieldStatus;
  uniform_percentage?: string | FieldStatus;
  
  books_responsible: 'pai' | 'mae' | 'dividido' | FieldStatus;
  books_percentage?: string | FieldStatus;
  
  activities_responsible: 'pai' | 'mae' | 'dividido' | FieldStatus;
  activities_percentage?: string | FieldStatus;
  
  excursions_responsible: 'pai' | 'mae' | 'dividido' | FieldStatus;
  excursions_percentage?: string | FieldStatus;
  
  emergency_contact: 'pai' | 'mae' | 'outro' | FieldStatus;
  emergency_who?: string | FieldStatus;
  
  transport_responsible: 'pai' | 'mae' | FieldStatus;
  
  tutor_decision: 'conjunto' | 'pai' | 'mae' | FieldStatus;
  tutor_payment: 'pai' | 'mae' | 'dividido' | FieldStatus;
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
}

export const planSections: Section[] = [
  {
    id: 'education',
    title: 'Educação Regular',
    route: 'educacao',
    completed: false
  },
  {
    id: 'extracurricular',
    title: 'Atividades Extracurriculares', 
    route: 'atividades',
    completed: false
  },
  {
    id: 'extras',
    title: 'Convites e Gastos Extras',
    route: 'convites',
    completed: false
  },
  {
    id: 'screens',
    title: 'Uso de Telas e Redes Sociais',
    route: 'telas',
    completed: false
  },
  {
    id: 'religion', 
    title: 'Religião',
    route: 'religiao',
    completed: false
  },
  {
    id: 'travel',
    title: 'Viagens',
    route: 'viagens',
    completed: false
  },
  {
    id: 'health',
    title: 'Saúde',
    route: 'saude',
    completed: false
  },
  {
    id: 'support',
    title: 'Rede de Apoio Terceirizada',
    route: 'apoio',
    completed: false
  },
  {
    id: 'coexistence',
    title: 'Convivência',
    route: 'convivencia',
    completed: false
  },
  {
    id: 'consequences',
    title: 'Consequências pelo Descumprimento',
    route: 'consequencias',
    completed: false
  }
];