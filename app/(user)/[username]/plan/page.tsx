'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@context/userContext';
import { ParentalPlan } from '@/types/shared.types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

const ParentalPlansPage: React.FC = () => {
    const { user } = useUser();
    const [plans, setPlans] = useState<ParentalPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const fetchPlans = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const plansQuery = query(
                    collection(db, 'parental_plans'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(plansQuery);
                const plansList = snapshot.docs.map(doc => ({
                    ...doc.data()
                } as ParentalPlan));

                setPlans(plansList);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching parental plans:', error);
                toast.error('Erro ao buscar os planos de parentalidade');
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [user]);

    const formatDate = (timestamp: { toDate: () => Date } | null) => {
        if (!timestamp) return 'Data não disponível';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold">Meus Planos de Parentalidade</h1>
                <Button asChild>
                    <Link href={`${pathname}/form`}>
                        Criar Novo Plano
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center mt-8">
                    <Spinner size="xl" />
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center mt-8 space-y-4">
                    <Alert variant="default" className="max-w-md mx-auto">
                        <AlertDescription>
                            Você ainda não possui planos de parentalidade.
                        </AlertDescription>
                    </Alert>
                    <Button asChild className="mt-4">
                        <Link href={`${pathname}/form`}>
                            Criar Seu Primeiro Plano
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <Card key={plan.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle>{plan.title}</CardTitle>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge variant="default">{plan.guardType}</Badge>
                                    <Badge variant="secondary">Lar: {plan.referenceHome}</Badge>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="pb-0">
                                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                                    <p>Criado em: {formatDate(plan.createdAt)}</p>
                                    <p>Atualizado em: {formatDate(plan.updatedAt)}</p>
                                </div>
                                
                                {plan.description && (
                                    <p className="line-clamp-2 text-sm">{plan.description}</p>
                                )}
                            </CardContent>
                            
                            <CardFooter className="flex justify-end gap-2 pt-4">
                                <Button 
                                    asChild
                                    variant="outline" 
                                    size="sm"
                                >
                                    <Link href={`${pathname}/view?planId=${plan.id}`}>
                                        Visualizar
                                    </Link>
                                </Button>
                                <Button 
                                    asChild
                                    size="sm"
                                >
                                    <Link href={`${pathname}/form?planId=${plan.id}`}>
                                        Editar
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParentalPlansPage;