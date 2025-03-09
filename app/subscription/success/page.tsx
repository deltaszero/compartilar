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
      // Use a timeout to avoid React router error during render
      redirectTimer = setTimeout(() => {
        router.push('/');
      }, 100);
      return () => clearTimeout(redirectTimer);
    }

    // Update subscription status in database
    const updateSubscription = async () => {
      try {
        setUpdateStatus('updating');
        console.log('Updating subscription with session ID:', sessionId);
        
        const response = await fetch('/api/update-subscription-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sessionId,
            userId: userData?.uid // Include user ID as well for more reliable updates
          }),
        });
        
        const result = await response.json();
        console.log('Subscription update result:', result);
        
        if (response.ok) {
          setUpdateStatus('success');
        } else {
          setUpdateStatus('error: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Failed to update subscription status:', error);
        setUpdateStatus('error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };

    updateSubscription();

    // Set up countdown for auto-redirect
    countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Schedule the redirect in a separate effect
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
  }, [sessionId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-purple-500/20">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Assinatura Confirmada!</h1>
          <p className="text-slate-300 mb-2">
            Sua assinatura Premium foi ativada com sucesso! 
          </p>
          <p className="text-yellow-400 font-bold mb-4 text-center">
            Por favor, clique no botão verde abaixo para concluir a ativação.
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
                  
                  setUpdateStatus('applying subscription directly...');
                  
                  try {
                    // Direct Firestore update method (simple and proven to work)
                    const userRef = doc(db, 'users', userData.uid);
                    await setDoc(userRef, {
                      subscription: {
                        active: true,
                        plan: 'premium',
                        directUpdate: true,
                        updatedAt: new Date().toISOString(),
                      }
                    }, { merge: true });
                    
                    console.log('Success: Document updated directly');
                    setUpdateStatus('direct update success');
                    
                    // Alert the user about success
                    setTimeout(() => {
                      window.alert('Sua assinatura premium foi ativada com sucesso! Por favor volte para a página inicial para acessar os recursos premium.');
                    }, 500);
                    
                    // Redirect after successful activation
                    setTimeout(() => {
                      router.push('/');
                    }, 2000);
                    
                  } catch (error) {
                    console.error('Error updating user document:', error);
                    setUpdateStatus('update error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  }
                }}
                size="lg"
                variant="default"
                className="w-full mt-2 bg-green-600 hover:bg-green-700 py-6 text-lg font-bold"
              >
                ATIVAR PREMIUM AGORA
              </Button>
              
              <p className="text-center text-xs text-slate-400 mt-2">
                Clique no botão acima para ativar seu acesso Premium imediatamente
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