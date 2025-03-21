import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// Form validation schema
const educationFormSchema = z.object({
  school: z.string().min(1, { message: 'O nome da escola é obrigatório' }),
  tuitionResponsible: z.enum(['pai', 'mae', 'publica'], {
    required_error: 'Selecione o responsável pelo pagamento das mensalidades',
  }),
  
  // School supplies
  suppliesResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo material escolar',
  }),
  suppliesPercentage: z.string().optional(),
  
  // Uniform
  uniformResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo fardamento',
  }),
  uniformPercentage: z.string().optional(),
  
  // Books
  booksResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas apostilas',
  }),
  booksPercentage: z.string().optional(),
  
  // Extra activities
  activitiesResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas atividades extras',
  }),
  activitiesPercentage: z.string().optional(),
  
  // Excursions
  excursionsResponsible: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelas excursões',
  }),
  excursionsPercentage: z.string().optional(),
  
  // Emergency contact
  emergencyContact: z.enum(['pai', 'mae', 'outro'], {
    required_error: 'Selecione o contato de emergência',
  }),
  emergencyWho: z.string().optional(),
  
  // School transport
  transportResponsible: z.enum(['pai', 'mae'], {
    required_error: 'Selecione o responsável pelo transporte escolar',
  }),
  
  // Private tutor
  tutorDecision: z.enum(['conjunto', 'pai', 'mae'], {
    required_error: 'Selecione quem decidirá sobre a contratação de professor particular',
  }),
  tutorPayment: z.enum(['pai', 'mae', 'dividido'], {
    required_error: 'Selecione o responsável pelo pagamento do professor particular',
  }),
  tutorPercentage: z.string().optional(),
  
  // Extended family authorization
  extendedFamilySchool: z.enum(['sim', 'nao'], {
    required_error: 'Selecione se a família extensa está autorizada na escola',
  }),
  extendedFamilyActivities: z.enum(['sim', 'nao'], {
    required_error: 'Selecione se a família extensa está autorizada nas atividades',
  }),
  
  // School events participation
  schoolEvents: z.enum(['ambos', 'revezamento'], {
    required_error: 'Selecione como será a participação dos genitores em eventos escolares',
  }),
});

// Infer type from schema
type EducationFormValues = z.infer<typeof educationFormSchema>;

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
      school: '',
      tuitionResponsible: 'pai',
      suppliesResponsible: 'pai',
      uniformResponsible: 'pai',
      booksResponsible: 'pai',
      activitiesResponsible: 'pai',
      excursionsResponsible: 'pai',
      emergencyContact: 'pai',
      transportResponsible: 'pai',
      tutorDecision: 'conjunto',
      tutorPayment: 'pai',
      extendedFamilySchool: 'nao',
      extendedFamilyActivities: 'nao',
      schoolEvents: 'ambos',
      // Optional fields
      suppliesPercentage: '',
      uniformPercentage: '',
      booksPercentage: '',
      activitiesPercentage: '',
      excursionsPercentage: '',
      emergencyWho: '',
      tutorPercentage: '',
      ...initialData
    },
  });
  
  // Watch values to show/hide conditional fields
  const watchSuppliesResponsible = form.watch('suppliesResponsible');
  const watchUniformResponsible = form.watch('uniformResponsible');
  const watchBooksResponsible = form.watch('booksResponsible');
  const watchActivitiesResponsible = form.watch('activitiesResponsible');
  const watchExcursionsResponsible = form.watch('excursionsResponsible');
  const watchEmergencyContact = form.watch('emergencyContact');
  const watchTutorPayment = form.watch('tutorPayment');
  
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
    onSubmit(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg border-2 border-black shadow-brutalist">
          <h2 className="text-xl font-bold mb-6">1. Educação Regular</h2>
          
          {/* School name */}
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.1. Em que escola o menor estuda:</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Tuition responsible */}
          <FormField
            control={form.control}
            name="tuitionResponsible"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.2. Quem será o responsável financeiro pelo pagamento das mensalidades?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pai" />
                      </FormControl>
                      <FormLabel className="font-normal">Pai</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mae" />
                      </FormControl>
                      <FormLabel className="font-normal">Mãe</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="publica" />
                      </FormControl>
                      <FormLabel className="font-normal">Escola pública</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Costs section title */}
          <h3 className="font-medium mt-8 mb-4">1.3. Quem arcará com os custos de:</h3>
          
          {/* School supplies */}
          <div className="pl-4 mb-6">
            <FormField
              control={form.control}
              name="suppliesResponsible"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="font-medium">- Material escolar</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal">Pai</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mae" />
                        </FormControl>
                        <FormLabel className="font-normal">Mãe</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dividido" />
                        </FormControl>
                        <FormLabel className="font-normal">Será dividido</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional percentage field */}
            {watchSuppliesResponsible === 'dividido' && (
              <FormField
                control={form.control}
                name="suppliesPercentage"
                render={({ field }) => (
                  <FormItem className="ml-6 mt-2">
                    <FormLabel>Em que porcentagem?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Uniform */}
          <div className="pl-4 mb-6">
            <FormField
              control={form.control}
              name="uniformResponsible"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="font-medium">- Fardamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal">Pai</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mae" />
                        </FormControl>
                        <FormLabel className="font-normal">Mãe</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dividido" />
                        </FormControl>
                        <FormLabel className="font-normal">Será dividido</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional percentage field */}
            {watchUniformResponsible === 'dividido' && (
              <FormField
                control={form.control}
                name="uniformPercentage"
                render={({ field }) => (
                  <FormItem className="ml-6 mt-2">
                    <FormLabel>Em que porcentagem?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Books */}
          <div className="pl-4 mb-6">
            <FormField
              control={form.control}
              name="booksResponsible"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="font-medium">- Apostilas</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal">Pai</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mae" />
                        </FormControl>
                        <FormLabel className="font-normal">Mãe</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dividido" />
                        </FormControl>
                        <FormLabel className="font-normal">Será dividido</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional percentage field */}
            {watchBooksResponsible === 'dividido' && (
              <FormField
                control={form.control}
                name="booksPercentage"
                render={({ field }) => (
                  <FormItem className="ml-6 mt-2">
                    <FormLabel>Em que porcentagem?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Activities */}
          <div className="pl-4 mb-6">
            <FormField
              control={form.control}
              name="activitiesResponsible"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="font-medium">- Atividades Extras propostas pela escola</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal">Pai</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mae" />
                        </FormControl>
                        <FormLabel className="font-normal">Mãe</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dividido" />
                        </FormControl>
                        <FormLabel className="font-normal">Será dividido</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional percentage field */}
            {watchActivitiesResponsible === 'dividido' && (
              <FormField
                control={form.control}
                name="activitiesPercentage"
                render={({ field }) => (
                  <FormItem className="ml-6 mt-2">
                    <FormLabel>Em que porcentagem?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Excursions */}
          <div className="pl-4 mb-6">
            <FormField
              control={form.control}
              name="excursionsResponsible"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="font-medium">- Excursões</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal">Pai</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mae" />
                        </FormControl>
                        <FormLabel className="font-normal">Mãe</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dividido" />
                        </FormControl>
                        <FormLabel className="font-normal">Será dividido</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional percentage field */}
            {watchExcursionsResponsible === 'dividido' && (
              <FormField
                control={form.control}
                name="excursionsPercentage"
                render={({ field }) => (
                  <FormItem className="ml-6 mt-2">
                    <FormLabel>Em que porcentagem?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          {/* Emergency contact */}
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.4. Quem a escola deverá contatar em caso de emergência?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pai" />
                      </FormControl>
                      <FormLabel className="font-normal">Pai</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mae" />
                      </FormControl>
                      <FormLabel className="font-normal">Mãe</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="outro" />
                      </FormControl>
                      <FormLabel className="font-normal">Outro</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Conditional "who" field */}
          {watchEmergencyContact === 'outro' && (
            <FormField
              control={form.control}
              name="emergencyWho"
              render={({ field }) => (
                <FormItem className="ml-6 mb-6">
                  <FormLabel>Quem?</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* School transport */}
          <FormField
            control={form.control}
            name="transportResponsible"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.5. Se for necessária a contratação de transporte escolar, quem arcará com os custos?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pai" />
                      </FormControl>
                      <FormLabel className="font-normal">Pai</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mae" />
                      </FormControl>
                      <FormLabel className="font-normal">Mãe</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Private tutor */}
          <FormField
            control={form.control}
            name="tutorDecision"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.6. Se for preciso contratar um professor particular, quem decidirá?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="conjunto" />
                      </FormControl>
                      <FormLabel className="font-normal">Em conjunto</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pai" />
                      </FormControl>
                      <FormLabel className="font-normal">Pai</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mae" />
                      </FormControl>
                      <FormLabel className="font-normal">Mãe</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Tutor payment */}
          <FormField
            control={form.control}
            name="tutorPayment"
            render={({ field }) => (
              <FormItem className="ml-6 mb-6">
                <FormLabel className="font-medium">- Quem será responsável pelo pagamento?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pai" />
                      </FormControl>
                      <FormLabel className="font-normal">Pai</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="mae" />
                      </FormControl>
                      <FormLabel className="font-normal">Mãe</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="dividido" />
                      </FormControl>
                      <FormLabel className="font-normal">Será dividido</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Conditional percentage field */}
          {watchTutorPayment === 'dividido' && (
            <FormField
              control={form.control}
              name="tutorPercentage"
              render={({ field }) => (
                <FormItem className="ml-12 mb-6">
                  <FormLabel>Em que porcentagem?</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Pai 70%, Mãe 30%" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Extended family authorization */}
          <FormField
            control={form.control}
            name="extendedFamilySchool"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.7. No que se refere à família extensa (avós, tios, madrastas, padrastos), eles estão autorizados a transportar o menor ou assinar documentos na escola?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="sim" />
                      </FormControl>
                      <FormLabel className="font-normal">Sim</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="nao" />
                      </FormControl>
                      <FormLabel className="font-normal">Não</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Extended family activities */}
          <FormField
            control={form.control}
            name="extendedFamilyActivities"
            render={({ field }) => (
              <FormItem className="ml-6 mb-6">
                <FormLabel className="font-medium">- E nas atividades extracurriculares?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="sim" />
                      </FormControl>
                      <FormLabel className="font-normal">Sim</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="nao" />
                      </FormControl>
                      <FormLabel className="font-normal">Não</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* School events */}
          <FormField
            control={form.control}
            name="schoolEvents"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="font-medium">1.8. Em festas escolares, os genitores:</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="ambos" />
                      </FormControl>
                      <FormLabel className="font-normal">Ambos participarão sempre</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="revezamento" />
                      </FormControl>
                      <FormLabel className="font-normal">Se revezarão (participando somente nas atividades em sua homenagem e revezando-se anualmente naquelas que o protagonista é a criança)</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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