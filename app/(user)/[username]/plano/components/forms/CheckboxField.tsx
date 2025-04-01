import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ 
  id, 
  checked, 
  onChange,
  disabled = false 
}) => {
  return (
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
    />
  );
};

export default CheckboxField;