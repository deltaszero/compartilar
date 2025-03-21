import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EducationSection } from '../types';
import { 
  educationFormSchema, 
  defaultEducationFormValues, 
  regularEducationFormFields,
  EducationFormValues,
  FormField as DataFormField,
  FormFieldConditional
} from '../data/regularEducationFormData';

interface RegularEducationFormProps {
  initialData?: Partial<EducationSection>;
  onSubmit: (data: EducationSection) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function RegularEducationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: RegularEducationFormProps) {
  // Initialize form with default values and schema
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      ...defaultEducationFormValues,
      ...initialData
    },
  });
  
  // Update form when initial data changes
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        // @ts-ignore - dynamic key access
        if (value !== undefined) form.setValue(key as any, value);
      });
    }
  }, [initialData, form]);
  
  // Form submission handler
  const handleSubmit = (values: EducationFormValues) => {
    onSubmit(values as unknown as EducationSection);
  };

  // Function to check if a field should be shown based on conditional display rules
  const shouldShowField = (field: DataFormField): boolean => {
    if (!field.showWhen) return true;
    
    const { field: dependsOn, value: requiredValue } = field.showWhen;
    const watchedValue = form.watch(dependsOn);
    
    return watchedValue === requiredValue;
  };

  // Function to render a field based on its type
  const renderField = (field: DataFormField) => {
    // Skip rendering if conditional display says to hide
    if (!shouldShowField(field)) return null;

    switch (field.fieldType) {
      case 'text':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className={field.showWhen ? "ml-6 mt-2" : "mb-6"}>
                <FormLabel className={field.showWhen ? "" : "font-medium"}>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={field.placeholder} 
                    {...formField} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'radio':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className={field.showWhen ? "ml-6 mb-4" : "mb-6"}>
                <FormLabel className={field.showWhen ? "" : "font-medium"}>{field.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <FormItem key={option.id} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={option.value} />
                        </FormControl>
                        <FormLabel className="font-normal">{option.label}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case 'section':
        return (
          <div key={field.id} className="mb-6">
            <h3 className="font-medium mt-8 mb-4">{field.label}</h3>
            <div className="pl-4">
              {field.fields?.map(subField => renderField(subField))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg border-2 border-black shadow-brutalist">
          <h2 className="text-xl font-bold mb-6">1. Educação Regular</h2>
          
          {regularEducationFormFields.map(renderField)}
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-mainStrongGreen"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}