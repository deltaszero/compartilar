'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { toast } from '@/hooks/use-toast';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PlanListItem from './components/PlanListItem';
import { getParentalPlans } from './services/plan-service';
import { ParentalPlan } from './types';
import LoadingPage from '@/app/components/LoadingPage';

export default function ParentalPlansPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user, userData, loading } = useUser();
  
  const [plans, setPlans] = useState<ParentalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load parental plans
  useEffect(() => {
    const loadPlans = async () => {
      if (!user || !userData) {
        router.push('/login');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const userPlans = await getParentalPlans(user);
        setPlans(userPlans);
      } catch (err) {
        console.error('Error loading parental plans:', err);
        setError('Não foi possível carregar os planos parentais. Tente novamente mais tarde.');
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar os planos parentais. Tente novamente mais tarde.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      loadPlans();
    }
  }, [user, userData, router, loading]);

  // Navigate to create new plan
  const handleCreateNewPlan = () => {
    router.push(`/${username}/plano/novo`);
  };

  if (loading || isLoading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <UserProfileBar pathname='Planos Parentais' />
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Planos Parentais</h1>
          <Button
            onClick={handleCreateNewPlan}
            className="bg-mainStrongGreen"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Criar Novo Plano
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-xl bg-white dark:bg-gray-800 text-center">
            <h3 className="text-xl font-medium mb-2">Nenhum plano parental encontrado</h3>
            <p className="text-gray-500 mb-6">
              Crie um novo plano parental para começar a organizar as responsabilidades com seus filhos.
            </p>
            <Button 
              onClick={handleCreateNewPlan}
              className="bg-mainStrongGreen"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Criar Primeiro Plano
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanListItem key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}