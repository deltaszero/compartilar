import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RadioOption } from './index';
import QuestionTooltip from './QuestionTooltip';

interface RadioFieldProps {
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioField: React.FC<RadioFieldProps> = ({ 
  options, 
  value, 
  onChange,
  disabled = false 
}) => {
  return (
    <RadioGroup
      value={value || ''}
      onValueChange={onChange}
      className="flex flex-col space-y-2"
      disabled={disabled}
    >
      {options.map((option) => (
        <div key={String(option.value)} className="flex items-center space-x-2">
          <RadioGroupItem id={String(option.value)} value={String(option.value)} />
          <div className="flex items-center">
            <Label htmlFor={String(option.value)} className="cursor-pointer">
              {option.label}
            </Label>
            {option.tooltip && <QuestionTooltip content={option.tooltip} />}
          </div>
        </div>
      ))}
    </RadioGroup>
  );
};

export default RadioField;