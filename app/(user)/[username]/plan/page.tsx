'use client';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@context/userContext';
import { ParentalPlan } from '@/types/shared.types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Meus Planos de Parentalidade</h1>
                <Link href={`${pathname}/form`} className="btn btn-primary">
                    Criar Novo Plano
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center mt-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center mt-8">
                    <div className="alert alert-info">
                        <p>Você ainda não possui planos de parentalidade.</p>
                    </div>
                    <Link href={`${pathname}/form`} className="btn btn-primary mt-4">
                        Criar Seu Primeiro Plano
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">{plan.title}</h2>
                                <p className="text-sm opacity-70">Criado em: {formatDate(plan.createdAt)}</p>
                                <p className="text-sm opacity-70">Atualizado em: {formatDate(plan.updatedAt)}</p>
                                <div className="badge badge-primary">{plan.guardType}</div>
                                <div className="badge badge-secondary">Lar: {plan.referenceHome}</div>
                                
                                {plan.description && (
                                    <p className="mt-2 line-clamp-2">{plan.description}</p>
                                )}
                                
                                <div className="card-actions justify-end mt-4">
                                    <Link 
                                        href={`${pathname}/form?planId=${plan.id}`} 
                                        className="btn btn-primary btn-sm"
                                    >
                                        Editar
                                    </Link>
                                    <Link 
                                        href={`${pathname}/view?planId=${plan.id}`} 
                                        className="btn btn-outline btn-sm"
                                    >
                                        Visualizar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParentalPlansPage;