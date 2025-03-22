'use client';

import { use } from 'react';
import { usePlan } from './context';
import { planSections } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, CheckCircle2, CircleDashed, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate, cn } from '@/lib/utils';
import Image from 'next/image';

export default function PlanPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error } = usePlan();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary border-t-primary mb-4"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Carregando plano parental...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 bg-white/50 border border-red-200 rounded-lg max-w-md mx-auto my-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Erro ao carregar plano</h1>
          <p className="text-gray-600 mb-6">{error || 'Plano parental não encontrado ou sem permissão de acesso'}</p>
          <Button 
            variant="default"
            onClick={() => router.push(`/${resolvedParams.username}/plano`)}
          >
            Voltar para lista de planos
          </Button>
        </div>
      </div>
    );
  }

  const getCompletedSectionsCount = () => {
    if (!plan.sections) return 0;
    
    let count = 0;
    planSections.forEach(section => {
      if (plan.sections[section.id as keyof typeof plan.sections]) {
        count++;
      }
    });
    
    return count;
  };

  // Calculate completion percentage
  const completionPercentage = Math.round((getCompletedSectionsCount() / planSections.length) * 100);
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h2 className="text-sm font-medium text-gray-500">Última atualização</h2>
          <span className="text-xs font-medium text-gray-500">
            {formatDate(new Date(plan.updated_at))}
          </span>
        </div>
        
        <div className="bg-white border-2 border-main rounded-lg p-4 md:p-6 shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Progresso Geral</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-main/10 text-main">
              {completionPercentage}% completo
            </span>
          </div>
          
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-main h-full transition-all duration-500 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">{getCompletedSectionsCount()}</span> de <span className="font-medium">{planSections.length}</span> seções preenchidas
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {planSections.map((section) => {
          const isCompleted = !!plan.sections[section.id as keyof typeof plan.sections];
          
          return (
            <div 
              key={section.id}
              className={cn(
                "bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg",
                isCompleted ? "border-main/70" : "border-gray-200"
              )}
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full mr-3 flex-shrink-0",
                    isCompleted ? "bg-main text-white" : "bg-gray-100 border border-gray-200"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <CircleDashed className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">{section.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {isCompleted ? "Informações preenchidas" : "Pendente de preenchimento"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50">
                <Button 
                  onClick={() => router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/${section.route}`)}
                  className={cn(
                    "w-full justify-center text-sm",
                    isCompleted 
                      ? "bg-white border-2 border-main text-main hover:bg-main hover:text-white" 
                      : "bg-main text-white hover:bg-main/90"
                  )}
                >
                  {isCompleted ? (
                    <>
                      <Pencil className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">Editar</span> Informações
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">Preencher</span> Agora
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {getCompletedSectionsCount() === 0 && (
        <div className="flex flex-col items-center justify-center my-8 p-4 md:p-6 bg-white/50 border border-dashed border-gray-300 rounded-lg">
          <Image 
            src="/assets/images/plan_01.webp" 
            alt="Plano Parental" 
            width={200} 
            height={140} 
            className="mb-4 opacity-90"
          />
          <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">Comece preenchendo as seções</h3>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-4 max-w-md">
            Preencha as seções do plano parental para documentar os acordos e diretrizes sobre a educação e cuidados com a criança.
          </p>
          <Button 
            onClick={() => router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/educacao`)} 
            className="bg-main hover:bg-main/90 w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Começar com Educação Regular
          </Button>
        </div>
      )}
    </div>
  );
}