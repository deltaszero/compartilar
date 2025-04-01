// Type definitions for form questions
export interface BaseQuestion {
  id: string;
  label: string;
  tooltip?: string;
  required: boolean;
  conditionalOn?: {
    field: string;
    value: string | boolean | number;
  };
}

export interface RadioOption<T = string> {
  value: T;
  label: string;
  tooltip?: string;
}

export interface RadioQuestion<T = string> extends BaseQuestion {
  type: 'radio';
  options: RadioOption<T>[];
  defaultValue?: T;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  defaultValue?: string;
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export interface SelectQuestion<T = string> extends BaseQuestion {
  type: 'select';
  options: RadioOption<T>[];
  placeholder?: string;
  defaultValue?: T;
}

export interface CheckboxQuestion extends BaseQuestion {
  type: 'checkbox';
  defaultValue?: boolean;
}

export type FieldQuestion<T = string> = 
  | RadioQuestion<T>
  | TextQuestion
  | NumberQuestion
  | SelectQuestion<T>
  | CheckboxQuestion;

// Type for form sections
export interface FormSection<T = any> {
  id: string;
  title: string;
  description?: string;
  questions: Record<string, any>;
}

// Export components
export { default as FormLayout } from './FormLayout';
export { default as FormField } from './FormField';
export { default as FormSection } from './FormSection';
export { default as RadioField } from './RadioField';
export { default as TextField } from './TextField';
export { default as NumberField } from './NumberField';
export { default as SelectField } from './SelectField';
export { default as CheckboxField } from './CheckboxField';
export { default as QuestionTooltip } from './QuestionTooltip';
