'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@context/userContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionButtonProps {
  productId?: string;
}

export const SubscriptionButton = ({ productId }: SubscriptionButtonProps) => {
  // Use the environment variable if available, otherwise use the prop or fallback
  const priceId = productId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_1R0octRteT9jmQohOV9JBG72";
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useUser();
  const { toast } = useToast();

  const handleSubscription = async () => {
    if (!userData || !userData.email) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para assinar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a checkout session on the server using the correct endpoint
      const response = await fetch('/api/webhooks/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          email: userData.email,
          userId: userData.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar sessão de pagamento');
      }

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um problema ao processar sua assinatura. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSubscription}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 text-md font-semibold font-raleway"
      size="sm"
    >
      {isLoading ? 'Processando...' : 'Assinar Premium'}
    </Button>
  );
};