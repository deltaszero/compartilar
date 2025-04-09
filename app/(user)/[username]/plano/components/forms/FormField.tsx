import React from 'react';
import { FieldQuestion } from './index';
import RadioField from './RadioField';
import TextField from './TextField';
import NumberField from './NumberField';
import SelectField from './SelectField';
import CheckboxField from './CheckboxField';
import QuestionTooltip from './QuestionTooltip';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  field: FieldQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ 
  field, 
  value, 
  onChange, 
  error,
  disabled = false
}) => {
  // Show conditional field only if condition is met
  if (field.conditionalOn) {
    const { field: parentField, value: requiredValue } = field.conditionalOn;
    // Get parent field value from the form state using global state or context
    const parentValue = window.formState?.[parentField]; // This should be replaced with proper state management
    if (String(parentValue) !== String(requiredValue)) {
      return null;
    }
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center">
        <Label htmlFor={field.id} className={`text-base font-medium ${field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}>
          {field.label}
        </Label>
        {field.tooltip && <QuestionTooltip content={field.tooltip} />}
      </div>
      
      {field.type === 'radio' && (
        <RadioField 
          options={field.options} 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
        />
      )}
      
      {field.type === 'text' && (
        <TextField 
          id={field.id} 
          value={value} 
          onChange={onChange} 
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}
      
      {field.type === 'number' && (
        <NumberField 
          id={field.id}
          value={value} 
          onChange={onChange} 
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}
      
      {field.type === 'select' && (
        <SelectField 
          id={field.id}
          options={field.options} 
          value={value} 
          onChange={onChange} 
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}
      
      {field.type === 'checkbox' && (
        <CheckboxField 
          id={field.id}
          checked={value} 
          onChange={onChange} 
          disabled={disabled}
        />
      )}
      
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default FormField;