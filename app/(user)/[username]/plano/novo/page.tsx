'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { toast } from '@/hooks/use-toast';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KidInfo } from '../../criancas/types';
import { EducationSection, ParentalPlan } from '../types';
import RegularEducationForm from '../components/RegularEducationForm';
import LoadingPage from '@/app/components/LoadingPage';
import { createParentalPlan } from '../services/plan-service';
import { fetchChildData } from '../../criancas/[kid]/services/child-api';
import { cn } from '@/lib/utils';
import { CheckCircle2, BookOpen, Users, Gift, Monitor, Church, Plane, HeartPulse, UserCog, Calendar, ChevronRight } from 'lucide-react';

// Section navigation items
const SECTION_NAV = [
  { id: 'info', label: 'Informações Básicas', icon: <Users className="h-5 w-5" /> },
  { id: 'education', label: 'Educação Regular', icon: <BookOpen className="h-5 w-5" />, isCompleted: false },
  { id: 'extracurricular', label: 'Atividades Extracurriculares', icon: <Calendar className="h-5 w-5" />, disabled: true },
  { id: 'gifts', label: 'Convites e Gastos Extras', icon: <Gift className="h-5 w-5" />, disabled: true },
  { id: 'screens', label: 'Uso de Telas', icon: <Monitor className="h-5 w-5" />, disabled: true },
  { id: 'religion', label: 'Religião', icon: <Church className="h-5 w-5" />, disabled: true },
  { id: 'travel', label: 'Viagens', icon: <Plane className="h-5 w-5" />, disabled: true },
  { id: 'health', label: 'Saúde', icon: <HeartPulse className="h-5 w-5" />, disabled: true },
  { id: 'support', label: 'Rede de Apoio', icon: <UserCog className="h-5 w-5" />, disabled: true }
];

export default function NewParentalPlanPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user, userData, loading } = useUser();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [availableChildren, setAvailableChildren] = useState<KidInfo[]>([]);
  const [educationData, setEducationData] = useState<Partial<EducationSection> | null>(null);
  
  const [activeSection, setActiveSection] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  
  // Get available children
  useEffect(() => {
    const loadChildren = async () => {
      if (!user || !userData) {
        router.push('/login');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get user's token and ID
        const token = await user.getIdToken(true);
        const userId = user.uid;
        
        // Fetch children that the user has access to
        const response = await fetch(`/api/children/access?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch children: ${response.status}`);
        }
        
        const children = await response.json();
        
        // Filter for children where user is an editor or owner (can't link viewers)
        const editableChildren = children.filter(
          (child: KidInfo) => child.accessLevel === 'editor' || child.accessLevel === 'owner'
        );
        
        setAvailableChildren(editableChildren || []);
        
      } catch (err) {
        console.error('Error loading children:', err);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar as crianças. Tente novamente mais tarde.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      loadChildren();
    }
  }, [user, userData, router, loading]);
  
  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    // Validate info section before allowing navigation
    if (activeSection === 'info' && sectionId !== 'info') {
      if (!title.trim()) {
        toast({
          variant: 'destructive',
          title: 'Título obrigatório',
          description: 'Por favor, adicione um título ao plano parental.'
        });
        return;
      }
      
      if (selectedChildren.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Criança obrigatória',
          description: 'Por favor, selecione pelo menos uma criança.'
        });
        return;
      }
      
      // Mark info section as completed
      if (!completedSections.includes('info')) {
        setCompletedSections(prev => [...prev, 'info']);
      }
    }
    
    // Don't navigate to disabled sections
    const section = SECTION_NAV.find(s => s.id === sectionId);
    if (section?.disabled) {
      toast({
        variant: "default",
        title: "Em breve",
        description: "Esta seção será implementada em breve."
      });
      return;
    }
    
    setActiveSection(sectionId);
  };
  
  // Handle child selection
  const handleChildSelection = (childId: string) => {
    setSelectedChildren(prevSelected => {
      if (prevSelected.includes(childId)) {
        return prevSelected.filter(id => id !== childId);
      } else {
        return [...prevSelected, childId];
      }
    });
  };
  
  // Handle education form submission
  const handleEducationSubmit = (data: EducationSection) => {
    setEducationData(data);
    if (!completedSections.includes('education')) {
      setCompletedSections(prev => [...prev, 'education']);
    }
    toast({
      title: 'Seção salva',
      description: 'Dados de Educação Regular salvos com sucesso.'
    });
  };
  
  // Create new parental plan
  const handleCreatePlan = async () => {
    if (!user) return;
    
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Título obrigatório',
        description: 'Por favor, adicione um título ao plano parental.'
      });
      return;
    }
    
    if (selectedChildren.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Criança obrigatória',
        description: 'Por favor, selecione pelo menos uma criança.'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const planData: Partial<ParentalPlan> = {
        title,
        description,
        status: 'active', // Default to active
        childrenIds: selectedChildren,
        regularEducation: educationData || undefined
      };
      
      const planId = await createParentalPlan(user, planData);
      
      toast({
        title: 'Plano criado',
        description: 'Plano parental criado com sucesso!'
      });
      
      // Navigate to the plan details page
      router.push(`/${username}/plano/${planId}`);
      
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível criar o plano parental. Tente novamente mais tarde.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check if a section is completed
  const isSectionCompleted = (sectionId: string) => {
    return completedSections.includes(sectionId);
  };
  
  if (loading || isLoading) {
    return <LoadingPage />;
  }
  
  return (
    <div>
      <UserProfileBar pathname='Novo Plano Parental' />
      <div className="p-4 mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Novo Plano Parental</h1>
          <p className="text-gray-600 mt-1">
            Crie um plano parental para organizar as responsabilidades dos cuidadores.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:w-1/4">
            <Card className="border-2 border-black shadow-brutalist sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Seções do Plano</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-1">
                  {SECTION_NAV.map((section) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left p-2 h-auto",
                        activeSection === section.id && "bg-slate-100",
                        section.disabled && "opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => handleSectionChange(section.id)}
                      disabled={section.disabled}
                    >
                      <div className="flex items-center w-full">
                        <div className="flex items-center gap-3 flex-1">
                          <span className={cn(
                            "p-1 rounded-full",
                            isSectionCompleted(section.id) ? "text-green-500" : "text-gray-500"
                          )}>
                            {isSectionCompleted(section.id) ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              section.icon
                            )}
                          </span>
                          <span>{section.label}</span>
                        </div>
                        {!section.disabled && <ChevronRight className="h-4 w-4 opacity-60" />}
                      </div>
                    </Button>
                  ))}
                </nav>
                
                {/* Create Plan Button */}
                <div className="mt-6">
                  <Button 
                    onClick={handleCreatePlan}
                    disabled={isSubmitting || completedSections.length === 0}
                    className="w-full bg-mainStrongGreen"
                  >
                    {isSubmitting ? "Criando..." : "Criar Plano Parental"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Content Area */}
          <div className="lg:w-3/4">
            {/* Basic Info Section */}
            {activeSection === 'info' && (
              <Card className="border-2 border-black shadow-brutalist">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Plano Parental *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Plano Parental 2024 - João e Maria"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  {/* Plan Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o objetivo deste plano parental..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  {/* Children Selection */}
                  <div className="space-y-2">
                    <Label>Selecione as crianças para este plano *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {availableChildren.length === 0 ? (
                        <div className="col-span-2 p-6 text-center border border-dashed border-gray-300 rounded-md">
                          <p className="text-gray-600 font-medium mb-2">
                            Nenhuma criança disponível para criar um plano
                          </p>
                          <p className="text-gray-500 text-sm">
                            Para criar um plano parental, você precisa primeiro adicionar crianças e ser editor das mesmas.
                          </p>
                          <Button
                            onClick={() => router.push(`/${username}/criancas/novo`)}
                            className="mt-4 bg-mainStrongGreen"
                            size="sm"
                          >
                            Adicionar Criança
                          </Button>
                        </div>
                      ) : (
                        availableChildren.map((child) => (
                          <Button
                            key={child.id}
                            type="button"
                            variant={selectedChildren.includes(child.id) ? 'default' : 'outline'}
                            className={`justify-start h-auto py-3 ${selectedChildren.includes(child.id) ? 'bg-mainStrongGreen' : ''}`}
                            onClick={() => handleChildSelection(child.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {/* Child avatar */}
                              {child.photoURL ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img 
                                    src={child.photoURL} 
                                    alt={child.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold">
                                    {child.firstName?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                              
                              {/* Child info */}
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{child.firstName} {child.lastName}</span>
                                <span className="text-xs text-gray-500">
                                  {child.accessLevel === 'owner' ? 'Proprietário' : 'Editor'}
                                </span>
                              </div>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-2">
                      * Campos obrigatórios
                    </p>
                  </div>
                  
                  {/* Next Section Button */}
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={() => handleSectionChange('education')}
                      className="bg-mainStrongGreen"
                    >
                      Avançar para Educação Regular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Education Section */}
            {activeSection === 'education' && (
              <>
                <RegularEducationForm 
                  initialData={educationData || undefined}
                  onSubmit={handleEducationSubmit}
                  onCancel={() => handleSectionChange('info')}
                  isSubmitting={isSubmitting}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}