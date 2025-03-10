'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUser } from '@context/userContext';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData } = useUser();
  const [countdown, setCountdown] = useState(30); // Increased countdown to give time to use the button
  const [updateStatus, setUpdateStatus] = useState<string>('pending');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;
    
    // If no session ID, redirect to home
    if (!sessionId) {
      redirectTimer = setTimeout(() => {
        router.push('/');
      }, 100);
      return () => clearTimeout(redirectTimer);
    }

    // Automatically activate subscription directly from client side
    const activateSubscription = async () => {
      if (!userData?.uid) {
        setUpdateStatus('waiting for user data...');
        return;
      }
      
      try {
        setUpdateStatus('activating subscription automatically...');
        console.log('Activating subscription with session ID:', sessionId);
        
        // Direct Firestore update method (this is what works in the button)
        const userRef = doc(db, 'users', userData.uid);
        await setDoc(userRef, {
          subscription: {
            active: true,
            plan: 'premium',
            stripeSessionId: sessionId,
            autoActivated: true,
            updatedAt: new Date().toISOString(),
          }
        }, { merge: true });
        
        console.log('Success: Subscription activated automatically');
        setUpdateStatus('success: auto-activated');
        
        // Start a shorter countdown since the subscription is now active
        setCountdown(5);
        
      } catch (error) {
        console.error('Failed to auto-activate subscription:', error);
        setUpdateStatus('auto-activation error - please use manual button');
        
        // Also try the API method as fallback
        try {
          const response = await fetch('/api/update-subscription-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              sessionId,
              userId: userData?.uid
            }),
          });
          
          const result = await response.json();
          console.log('API fallback result:', result);
          
          if (response.ok) {
            setUpdateStatus('success: api-activated');
          }
        } catch (apiError) {
          console.error('API fallback also failed:', apiError);
        }
      }
    };

    // Try to activate subscription automatically
    if (userData?.uid) {
      activateSubscription();
    } else {
      // If no user data yet, set up a watcher
      const userDataCheck = setInterval(() => {
        if (userData?.uid) {
          clearInterval(userDataCheck);
          activateSubscription();
        }
      }, 500);
      
      // Clean up interval
      return () => clearInterval(userDataCheck);
    }

    // Set up countdown for auto-redirect
    countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          redirectTimer = setTimeout(() => {
            router.push('/');
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [sessionId, userData?.uid, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-purple-500/20">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Assinatura Confirmada!</h1>
          <p className="text-slate-300 mb-2">
            {updateStatus.includes('success') 
              ? 'Sua assinatura Premium foi ativada com sucesso!' 
              : 'Ativando sua assinatura Premium automaticamente...'}
          </p>
          <p className={`font-bold mb-4 text-center ${updateStatus.includes('success') ? 'text-green-400' : 'text-yellow-400'}`}>
            {updateStatus.includes('error') 
              ? 'Por favor, use o botão verde abaixo para ativar manualmente.' 
              : updateStatus.includes('success')
                ? 'Ativação concluída! Você já pode acessar os recursos premium.'
                : 'Aguarde enquanto completamos a ativação...'}
          </p>
          
          {/* Debug information */}
          <div className="mb-6 p-3 bg-slate-700 rounded text-left text-xs">
            <p className="text-white mb-1"><strong>Status:</strong> {updateStatus}</p>
            <p className="text-white mb-1"><strong>Session ID:</strong> {sessionId?.substring(0, 10)}...</p>
            <p className="text-white mb-1"><strong>User ID:</strong> {userData?.uid?.substring(0, 10)}...</p>
            
            <div className="grid gap-2">
              <Button 
                onClick={async () => {
                  if (!userData || !userData.uid) {
                    setUpdateStatus('error: user data not available');
                    return;
                  }
                  
                  setUpdateStatus('applying subscription manually...');
                  
                  try {
                    // Direct Firestore update method (simple and proven to work)
                    const userRef = doc(db, 'users', userData.uid);
                    await setDoc(userRef, {
                      subscription: {
                        active: true,
                        plan: 'premium',
                        manualActivation: true,
                        stripeSessionId: sessionId,
                        updatedAt: new Date().toISOString(),
                      }
                    }, { merge: true });
                    
                    console.log('Success: Document updated directly');
                    setUpdateStatus('success: manual activation');
                    
                    // Show success message and redirect
                    setCountdown(3);
                    
                  } catch (error) {
                    console.error('Error updating user document:', error);
                    setUpdateStatus('update error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  }
                }}
                size="lg"
                variant="default"
                className={`w-full mt-2 py-6 text-lg font-bold ${
                  updateStatus.includes('success') 
                    ? 'bg-gray-500 hover:bg-gray-600 opacity-50'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={updateStatus.includes('success')}
              >
                {updateStatus.includes('success') 
                  ? 'PREMIUM JÁ ATIVADO ✓' 
                  : 'ATIVAR PREMIUM MANUALMENTE'}
              </Button>
              
              <p className="text-center text-xs text-slate-400 mt-2">
                {updateStatus.includes('success')
                  ? 'Sua assinatura premium já está ativa'
                  : updateStatus.includes('error')
                    ? 'Use este botão se a ativação automática falhou'
                    : 'Este botão é um backup caso a ativação automática falhe'}
              </p>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm mb-8">
            Você será redirecionado em {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Voltar para a Home
          </Button>
        </div>
      </div>
    </div>
  );
}