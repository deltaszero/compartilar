import React from 'react';
import { Input } from '@/components/ui/input';

interface TextFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({ 
  id, 
  value, 
  onChange, 
  placeholder,
  disabled = false 
}) => {
  return (
    <Input
      id={id}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
      disabled={disabled}
    />
  );
};

export default TextField;