import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FormField from './FormField';
import { FormSection as FormSectionType, FieldQuestion } from './index';

interface FormSectionProps {
    section: FormSectionType;
    formState: Record<string, any>;
    onChange: (fieldId: string, value: any) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    pending?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
    section,
    formState,
    onChange,
    errors = {},
    disabled = false,
    pending = false
}) => {
    // Render section title once at the top
    return (
        <div className="mb-6">
            {/* <div className="mb-4">
        <h2 className="text-xl font-semibold">{section.title}</h2>
        {section.description && <p className="text-muted-foreground text-sm mt-1">{section.description}</p>}
      </div> */}

            <div className="space-y-4">
                {Object.entries(section.questions).map(([fieldId, field]) => {
                    // Handle nested fields (as a group in one card)
                    if (typeof field === 'object' && !('type' in field)) {
                        return (
                            <Card key={fieldId} className="bg-bw p-4 border-2 border-black shadow-brutalist rounded-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{fieldId}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-l-2 pl-4 pb-2 pt-2 border-gray-200">
                                        {Object.entries(field).map(([nestedId, nestedField]) => {
                                            if (nestedField !== null && typeof nestedField === 'object' && !('type' in nestedField)) {
                                                return (
                                                    <div key={nestedId} className="border-l-2 pl-4 pb-2 pt-2 border-gray-200 mt-2">
                                                        <h3 className="text-md font-medium mb-2">{nestedId}</h3>
                                                        {Object.entries(nestedField as Record<string, any>).map(([deepId, deepField]) => {
                                                            const fullId = `${fieldId}.${nestedId}.${deepId}`;
                                                            // Only render if field has a type (is a form field)
                                                            if (deepField !== null && typeof deepField === 'object' && 'type' in deepField) {
                                                                // Type assertion to FieldQuestion
                                                                const typedField = deepField as unknown as FieldQuestion;
                                                                return (
                                                                    <FormField
                                                                        key={fullId}
                                                                        field={typedField}
                                                                        value={formState[fullId]}
                                                                        onChange={(value) => onChange(fullId, value)}
                                                                        error={errors[fullId]}
                                                                        disabled={disabled || pending}
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                );
                                            }

                                            // If it's a direct field with a type
                                            const fullId = `${fieldId}.${nestedId}`;
                                            if (nestedField !== null && typeof nestedField === 'object' && 'type' in nestedField) {
                                                // Type assertion to FieldQuestion
                                                const typedField = nestedField as unknown as FieldQuestion;
                                                return (
                                                    <FormField
                                                        key={fullId}
                                                        field={typedField}
                                                        value={formState[fullId]}
                                                        onChange={(value) => onChange(fullId, value)}
                                                        error={errors[fullId]}
                                                        disabled={disabled || pending}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }

                    // If it's a direct field with a type, each gets its own card
                    if (field !== null && typeof field === 'object' && 'type' in field) {
                        // Type assertion to FieldQuestion
                        const typedField = field as unknown as FieldQuestion;
                        return (
                            <Card key={fieldId} className="bg-bw p-4 border-2 border-black shadow-brutalist rounded-none">
                                <CardContent className="pt-4">
                                    <FormField
                                        field={typedField}
                                        value={formState[fieldId]}
                                        onChange={(value) => onChange(fieldId, value)}
                                        error={errors[fieldId]}
                                        disabled={disabled || pending}
                                    />
                                </CardContent>
                            </Card>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default FormSection;