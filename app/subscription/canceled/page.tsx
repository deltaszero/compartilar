'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCanceledPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Set up countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <div className="flex flex-col items-center text-center">
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Assinatura Cancelada</h1>
          <p className="text-slate-300 mb-6">
            Você cancelou o processo de assinatura. Se tiver dúvidas ou precisar de ajuda, entre em contato com nosso suporte.
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Você será redirecionado em {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-600 hover:bg-slate-700"
          >
            Voltar para a Home
          </Button>
        </div>
      </div>
    </div>
  );
}