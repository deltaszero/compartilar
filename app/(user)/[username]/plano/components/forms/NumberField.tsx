import React from 'react';
import { Input } from '@/components/ui/input';

interface NumberFieldProps {
  id: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}

const NumberField: React.FC<NumberFieldProps> = ({ 
  id, 
  value, 
  onChange, 
  min, 
  max,
  placeholder,
  disabled = false
}) => {
  return (
    <Input
      id={id}
      type="number"
      value={value !== null ? value : ''}
      onChange={(e) => {
        const val = e.target.value ? parseFloat(e.target.value) : null;
        if (val !== null) {
          onChange(val);
        }
      }}
      min={min}
      max={max}
      placeholder={placeholder}
      className="w-full"
      disabled={disabled}
    />
  );
};

export default NumberField;