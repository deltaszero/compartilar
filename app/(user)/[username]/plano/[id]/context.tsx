'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ParentalPlan } from '../types';
import { getParentalPlan } from '../services/plan-service';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';

interface PlanContextType {
  plan: ParentalPlan | null;
  isLoading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType>({
  plan: null,
  isLoading: true,
  error: null,
  refreshPlan: async () => {},
});

export const usePlan = () => useContext(PlanContext);

interface PlanProviderProps {
  children: ReactNode;
  planId: string;
}

export function PlanProvider({ children, planId }: PlanProviderProps) {
  const [plan, setPlan] = useState<ParentalPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlanData = async () => {
    if (!planId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user ID for permission check
      let userId = null;
      const auth = getAuth();
      if (auth.currentUser) {
        userId = auth.currentUser.uid;
      } else {
        // We don't have a user ID, so we can't check permissions
        setError('Usuário não autenticado');
        toast({
          title: "Erro",
          description: "Você precisa estar logado para acessar este plano.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Pass the user ID for permission checking
      const planData = await getParentalPlan(planId, userId);
      
      if (!planData) {
        setError('Plano não encontrado ou sem permissão de acesso');
        toast({
          title: "Erro",
          description: "Plano parental não encontrado ou você não tem permissão para acessá-lo.",
          variant: "destructive",
        });
      } else {
        setPlan(planData);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      setError('Erro ao carregar o plano');
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar o plano parental.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [planId]);

  const refreshPlan = async () => {
    await fetchPlanData();
  };

  return (
    <PlanContext.Provider
      value={{
        plan,
        isLoading,
        error,
        refreshPlan
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}