'use client';

import React from 'react';
import { PremiumFeature } from '@/components/ui/premium-feature';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { BarChart3, CalendarRange, Users, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PremiumFeatureShowcase = () => {
  const { isPremium, refreshSubscriptionStatus, isLoading } = usePremiumFeatures();

  return (
    <div className="w-full mt-2 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-bold">Recursos Premium</h3>
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
            {isPremium ? 'Premium Ativo' : 'Versão Gratuita'}
          </span>
        </div>
        
        <button 
          onClick={refreshSubscriptionStatus}
          disabled={isLoading}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Analytics Premium Feature */}
        <PremiumFeature 
          feature="expense_analytics"
          className="h-full"
        >
          <Card className="border-2 border-black shadow-brutalist h-full bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
                Análise Financeira Avançada
              </CardTitle>
              <CardDescription>
                Gráficos e relatórios detalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm text-center">
                    Acesse relatórios detalhados sobre os gastos com cada criança
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </PremiumFeature>

        {/* Location History Premium Feature */}
        <PremiumFeature 
          feature="location_history"
          className="h-full"
        >
          <Card className="border-2 border-black shadow-brutalist h-full bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Clock className="h-4 w-4 mr-2 text-purple-400" />
                Histórico de Localização
              </CardTitle>
              <CardDescription>
                Acesso completo ao histórico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm text-center">
                    Histórico completo de check-ins e registros de localização
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </PremiumFeature>

        {/* Advanced Calendar Premium Feature */}
        <PremiumFeature 
          feature="advanced_calendar"
          className="h-full"
        >
          <Card className="border-2 border-black shadow-brutalist h-full bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <CalendarRange className="h-4 w-4 mr-2 text-purple-400" />
                Calendário Avançado
              </CardTitle>
              <CardDescription>
                Eventos e lembretes personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-1">
                  <p className="text-sm text-center">
                    Crie eventos com convites, lembretes e compartilhamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </PremiumFeature>
      </div>
    </div>
  );
};