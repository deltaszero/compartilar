'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getParentalPlans } from './services/plan-service';
import { ParentalPlan, planSections } from './types';
import { useUser } from '@/context/userContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";


import missingImage from '@/app/assets/images/plan_00_missing.webp';

export default function PlansPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [plans, setPlans] = useState<ParentalPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            if (!user) return;

            try {
                const fetchedPlans = await getParentalPlans(user.uid);
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
        };

        fetchPlans();
    }, [user, toast]);

    const handleCreateNewPlan = () => {
        router.push(`/${resolvedParams.username}/plano/novo`);
    };

    const getCompletedSectionsCount = (plan: ParentalPlan) => {
        if (!plan.sections) return 0;

        let count = 0;
        planSections.forEach(section => {
            if (plan.sections[section.id as keyof typeof plan.sections]) {
                count++;
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
            <div className="flex flex-col p-4 sm:p-6 pb-[6em] sm:h-[80vh]">
                <div className="mb-4 sm:mb-6 border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist inline-block">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-raleway">
                        Plano Parental
                    </h1>
                    <p className="mt-1 text-sm sm:text-base font-nunito">
                        Defina acordos sobre a educação e outros aspectos da vida da criança.
                    </p>
                </div>
                <div className="flex justify-end items-center mb-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle>{plan.title}</CardTitle>
                                    <CardDescription>
                                        Atualizado em {formatDate(new Date(plan.updated_at))}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                            <span>Progresso</span>
                                            <span>{getCompletedSectionsCount(plan)}/{planSections.length} seções</span>
                                        </div>
                                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary h-full"
                                                style={{ width: `${(getCompletedSectionsCount(plan) / planSections.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.push(`/${resolvedParams.username}/plano/${plan.id}`)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => router.push(`/${resolvedParams.username}/plano/${plan.id}/educacao`)}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}