'use client';

import { use } from 'react';
import { usePlan } from './context';
import { planSections } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, CheckCircle2, CircleDashed, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

export default function PlanPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error } = usePlan();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Erro</h1>
        <p className="text-center text-gray-500">{error || 'Plano não encontrado'}</p>
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

  return (
    <div className="p-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.push(`/${resolvedParams.username}/plano`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para lista de planos
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{plan.title}</h1>
        <p className="text-gray-500">
          Atualizado em {formatDate(new Date(plan.updated_at))}
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Progresso do Plano</CardTitle>
          <CardDescription>
            {getCompletedSectionsCount()}/{planSections.length} seções preenchidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary h-4 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-primary h-full" 
              style={{ width: `${(getCompletedSectionsCount() / planSections.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {planSections.map((section) => {
              const isCompleted = !!plan.sections[section.id as keyof typeof plan.sections];
              return (
                <Card key={section.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        {isCompleted ? 
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> : 
                          <CircleDashed className="mr-2 h-5 w-5 text-gray-400" />
                        }
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      onClick={() => router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/${section.route}`)}
                      className="mt-2"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {isCompleted ? "Editar" : "Preencher"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {getCompletedSectionsCount() === 0 && (
        <div className="flex justify-center my-8">
          <Image 
            src="/assets/images/plan_01.webp" 
            alt="Plano Parental" 
            width={300} 
            height={200} 
          />
        </div>
      )}
    </div>
  );
}