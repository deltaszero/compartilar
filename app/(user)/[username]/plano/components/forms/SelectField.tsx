import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioOption } from './index';

interface SelectFieldProps {
  id: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ 
  id, 
  options, 
  value, 
  onChange, 
  placeholder = 'Selecione uma opção',
  disabled = false
}) => {
  return (
    <Select 
      value={value || ''} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem 
            key={String(option.value)} 
            value={String(option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectField;