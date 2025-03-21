import { Timestamp } from 'firebase/firestore';

export interface ParentalPlan {
  id: string;
  title: string;
  description?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  createdBy: string;
  childrenIds: string[]; // IDs of children linked to this plan
  editors: string[]; // UIDs of users who can edit this plan
  viewers: string[]; // UIDs of users who can view this plan
  status: 'draft' | 'active' | 'archived';
  sections: PlanSection[];
}

export interface PlanSection {
  id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  fields: PlanField[];
}

export type PlanFieldType = 
  | 'text' 
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'number'
  | 'percentage'
  | 'date';

export interface PlanField {
  id: string;
  type: PlanFieldType;
  label: string;
  value: string | string[] | number | null;
  options?: PlanFieldOption[];
  required?: boolean;
  placeholder?: string;
  description?: string;
  conditional?: {
    dependsOn: string; // Field ID this condition depends on
    showWhen: string | string[]; // Value(s) that trigger showing this field
  };
}

export interface PlanFieldOption {
  id: string;
  label: string;
  value: string;
  hasInput?: boolean; // Whether this option has an additional input field
  inputLabel?: string; // Label for the additional input
  inputType?: 'text' | 'number' | 'percentage';
  inputValue?: string | number | null;
}

// Regular Education Section
export interface EducationSection {
  school: string;
  tuitionResponsible: 'pai' | 'mae' | 'publica';
  suppliesResponsible: 'pai' | 'mae' | 'dividido';
  suppliesPercentage?: string;
  uniformResponsible: 'pai' | 'mae' | 'dividido';
  uniformPercentage?: string;
  booksResponsible: 'pai' | 'mae' | 'dividido';
  booksPercentage?: string;
  activitiesResponsible: 'pai' | 'mae' | 'dividido';
  activitiesPercentage?: string;
  excursionsResponsible: 'pai' | 'mae' | 'dividido';
  excursionsPercentage?: string;
  emergencyContact: 'pai' | 'mae' | 'outro';
  emergencyWho?: string;
  transportResponsible: 'pai' | 'mae';
  tutorDecision: 'conjunto' | 'pai' | 'mae';
  tutorPayment: 'pai' | 'mae' | 'dividido';
  tutorPercentage?: string;
  extendedFamilySchool: 'sim' | 'nao';
  extendedFamilyActivities: 'sim' | 'nao';
  schoolEvents: 'ambos' | 'revezamento';
}

// Change log for tracking updates
export interface PlanChangeLog {
  id: string;
  planId: string;
  timestamp: Timestamp | string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'archive' | 'restore';
  fieldsBefore?: Record<string, any>;
  fieldsAfter?: Record<string, any>;
  sectionId?: string;
  fieldId?: string;
}