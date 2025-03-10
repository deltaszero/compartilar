'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * A component that shows subscription status messages and alerts
 * to keep users informed about their subscription status
 */
export function SubscriptionStatusBanner() {
  const { 
    isPremium, 
    isInGracePeriod, 
    isApproachingExpiration,
    graceEndsAt,
    refreshSubscriptionStatus,
    isLoading
  } = usePremiumFeatures();

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }, []);

  // Don't show anything if subscription is active and not approaching expiration
  if (isPremium && !isInGracePeriod && !isApproachingExpiration) {
    return null;
  }

  // Show grace period warning
  if (isInGracePeriod) {
    return (
      <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
          <div>
            <p className="font-bold">Assinatura Premium Expirada - Período de Cortesia</p>
            <p className="text-sm">
              Sua assinatura expirou, mas você ainda tem acesso aos recursos Premium por um período limitado.
              {graceEndsAt && (
                <span> O período de cortesia termina em <strong>{formatDate(graceEndsAt)}</strong>.</span>
              )}
            </p>
            <div className="mt-2">
              <Link 
                href="/subscription" 
                className="inline-flex items-center text-amber-800 hover:text-amber-600 font-medium text-sm"
              >
                Renovar Assinatura <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show approaching expiration warning
  if (isPremium && isApproachingExpiration) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <p className="font-bold">Sua Assinatura Premium Expira em Breve</p>
            <p className="text-sm">
              Sua assinatura Premium será renovada automaticamente nos próximos dias.
              Verifique se seu método de pagamento está atualizado para evitar interrupções.
            </p>
            <div className="mt-2">
              <Link 
                href="/payment-methods" 
                className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium text-sm"
              >
                Verificar Método de Pagamento <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show free tier status
  if (!isPremium) {
    return (
      <div className="bg-gray-100 border-l-4 border-gray-400 text-gray-700 p-4 mb-6">
        <div className="flex items-start">
          <div>
            <p className="font-bold">Você está usando a versão gratuita</p>
            <p className="text-sm">
              Faça upgrade para o plano Premium para acessar todos os recursos e desbloquear os limites de uso.
            </p>
            <div className="mt-2">
              <Link 
                href="/subscription" 
                className="inline-flex items-center text-purple-600 hover:text-purple-500 font-medium text-sm"
              >
                Ver Planos Premium <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}