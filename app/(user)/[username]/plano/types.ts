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

export interface EducationSection {
  school: string;
  tuition_responsible: 'pai' | 'mae' | 'publica';
  
  supplies_responsible: 'pai' | 'mae' | 'dividido';
  supplies_percentage?: string;
  
  uniform_responsible: 'pai' | 'mae' | 'dividido';
  uniform_percentage?: string;
  
  books_responsible: 'pai' | 'mae' | 'dividido';
  books_percentage?: string;
  
  activities_responsible: 'pai' | 'mae' | 'dividido';
  activities_percentage?: string;
  
  excursions_responsible: 'pai' | 'mae' | 'dividido';
  excursions_percentage?: string;
  
  emergency_contact: 'pai' | 'mae' | 'outro';
  emergency_who?: string;
  
  transport_responsible: 'pai' | 'mae';
  
  tutor_decision: 'conjunto' | 'pai' | 'mae';
  tutor_payment: 'pai' | 'mae' | 'dividido';
  tutor_percentage?: string;
  
  extended_family_school: 'sim' | 'nao';
  extended_family_activities: 'sim' | 'nao';
  
  school_events: 'ambos' | 'revezamento';
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