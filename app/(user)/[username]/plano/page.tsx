'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getParentalPlans, deleteParentalPlan } from './services/plan-service';
import { ParentalPlan, planSections } from './types';
import { useUser } from '@/context/userContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Eye, Trash2, NotebookText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";


import missingImage from '@/app/assets/images/plan_00_missing.webp';

export default function PlansPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [plans, setPlans] = useState<ParentalPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<ParentalPlan | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            if (!user) {
                console.log('No user found, skipping plans fetch');
                setIsLoading(false);
                return;
            }

            console.log('Client: Starting plans fetch for user', user.uid);
            try {
                // Add a longer timeout to ensure authentication is fully ready
                setTimeout(async () => {
                    try {
                        console.log('Client: Timeout complete, fetching plans...');
                        const fetchedPlans = await getParentalPlans(user.uid);
                        console.log('Client: Plans received in UI:', fetchedPlans.length);
                        
                        // Log raw plans data for debugging
                        console.log('Client: Raw plans data:', JSON.stringify(fetchedPlans).slice(0, 1000) + '...');
                        
                        setPlans(fetchedPlans);
                    } catch (error) {
                        console.error('Error fetching plans:', error);
                        toast({
                            title: "Erro",
                            description: "Não foi possível carregar os planos parentais.",
                            variant: "destructive",
                        });
                    } finally {
                        setIsLoading(false);
                    }
                }, 1000); // Increased to 1 second
            } catch (error) {
                console.error('Error in fetchPlans:', error);
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [user, toast]);
    
    const handleDeletePlan = async () => {
        if (!user || !planToDelete) return;
        
        setIsDeleting(true);
        
        try {
            await deleteParentalPlan(planToDelete.id, user.uid);
            
            // Remove the plan from the state
            setPlans(plans.filter(plan => plan.id !== planToDelete.id));
            
            toast({
                title: "Plano excluído",
                description: "O plano parental foi excluído com sucesso.",
            });
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast({
                title: "Erro",
                description: "Não foi possível excluir o plano parental.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
            setPlanToDelete(null);
        }
    };

    const handleCreateNewPlan = () => {
        router.push(`/${resolvedParams.username}/plano/novo`);
    };

    const getCompletedSectionsCount = (plan: ParentalPlan) => {
        // Handle case where sections field might not exist at all
        if (!plan.sections) return 0;

        let count = 0;
        planSections.forEach(section => {
            try {
                // Check if the section exists and has any data
                const sectionData = plan.sections?.[section.id as keyof typeof plan.sections];
                if (sectionData && Object.keys(sectionData).length > 0) {
                    count++;
                }
                
                // Handle legacy data structure where sections might be directly on the plan object
                if (!sectionData && plan[section.id as keyof typeof plan]) {
                    count++;
                }
            } catch (e) {
                console.error(`Error checking section ${section.id}:`, e);
            }
        });

        return count;
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="h-32 w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <UserProfileBar pathname='Plano de Parentalidade' />
            <div className="flex flex-col items-center p-2 sm:p-0 pb-[6em] max-w-4xl mx-auto">
                <div className="w-full mb-4 sm:mb-6 border-2 border-black p-3 sm:p-4 bg-white shadow-brutalist">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-raleway">
                        Plano Parental
                    </h1>
                    <p className="mt-1 text-sm sm:text-base font-nunito">
                        Defina acordos sobre a educação e outros aspectos da vida da criança.
                    </p>
                </div>
                <div className="w-full flex flex-row justify-end mb-6">
                    <Button onClick={handleCreateNewPlan} className="bg-mainStrongGreen px-4 text-md font-semibold font-raleway">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Plano
                    </Button>
                </div>

                {plans.length === 0 ? (
                    <Card className="text-center px-8 py-4 bg-bw rounded-none">
                        <CardHeader>
                            <CardTitle>
                                <div className='font-raleway'>
                                    Nenhum plano parental encontrado
                                </div>
                            </CardTitle>
                            <CardDescription>
                                <div className='font-nunito'>
                                    Crie um novo plano para começar a registrar acordos sobre a educação e outros aspectos da vida da criança.
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center my-8">
                                <Image
                                    src={missingImage}
                                    alt="Plano Parental"
                                    height={128}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button onClick={handleCreateNewPlan} className="bg-mainStrongGreen px-4 text-md font-semibold font-raleway">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Criar Plano Parental
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="overflow-hidden bg-bw">
                                <CardHeader className="pb-2">
                                    <CardTitle>
                                        <div className="flex flex-row font-raleway">
                                            <NotebookText className="mr-2 h-5 w-5" />
                                            {plan.title}
                                        </div>
                                    </CardTitle>
                                    <CardDescription>
                                        <div className="font-nunito text-sm font-light">
                                            Atualizado em {
                                                (() => {
                                                    try {
                                                        // Try with updated_at (snake_case format)
                                                        const date = plan.updated_at ? new Date(plan.updated_at) : 
                                                                  plan.updatedAt ? new Date(plan.updatedAt) : 
                                                                  plan.timestamp ? new Date(plan.timestamp) : 
                                                                  plan.updated_at === null ? new Date() : new Date();
                                                        
                                                        return date.toLocaleDateString('pt-BR', { 
                                                            weekday: 'long', 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        });
                                                    } catch (e) {
                                                        console.error('Error formatting date:', e, 'plan:', plan);
                                                        return 'Data indisponível';
                                                    }
                                                })()
                                            }
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                            <span>Progresso</span>
                                            <span>{getCompletedSectionsCount(plan)}/{planSections.length} seções</span>
                                        </div>
                                        <div className="py-2">
                                            <Progress value={(getCompletedSectionsCount(plan) / planSections.length) * 100} className="h-3" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <div className="w-full flex items-end justify-end gap-4">
                                        <Button
                                            variant="default"
                                            onClick={() => router.push(`/${resolvedParams.username}/plano/${plan.id}`)}
                                            className='px-4 text-md font-semibold font-raleway'
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Visualizar
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => {
                                                setPlanToDelete(plan);
                                                setShowDeleteDialog(true);
                                            }}
                                            className="bg-mainStrongRed px-4 text-md font-semibold font-raleway"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Plano Parental</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o plano "{planToDelete?.title}"?
                            <br /><br />
                            Esta ação não pode ser desfeita. O plano parental será permanentemente excluído.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlan}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}