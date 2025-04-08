'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { auth } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
    
    setIsLoading(false);
    
    // Check verification status periodically
    const checkVerification = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Force token refresh to get latest claims
        await auth.currentUser.getIdToken(true);
        
        // Reload the user to get fresh verification status
        await auth.currentUser.reload();
        
        console.log("Periodic check - Email verified:", auth.currentUser.emailVerified);
        
        if (auth.currentUser.emailVerified) {
          toast({
            title: "Email verificado",
            description: "Seu email foi verificado com sucesso. Redirecionando...",
          });
          
          // Wait a moment before redirecting
          setTimeout(() => {
            router.push('/login/redirect');
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      }
    };
    
    // Check immediately and then every 5 seconds
    checkVerification();
    const interval = setInterval(checkVerification, 5000);
    
    return () => clearInterval(interval);
  }, [router, searchParams, toast]);
  
  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar conectado para reenviar o email de verificação.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await sendEmailVerification(auth.currentUser);
      return Promise.resolve();
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao reenviar o email. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };
  
  const handleManualVerification = async () => {
    setVerifying(true);
    try {
      // If user isn't signed in, try to sign in with the stored email
      if (!auth.currentUser && email) {
        // We can't sign in here without a password, so prompt user to sign in again
        toast({
          title: "Login necessário",
          description: "Por favor, faça login novamente para verificar seu email.",
        });
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
      
      // We manually check again by reloading the user multiple times
      // Firebase sometimes takes a moment to propagate verification status
      if (auth.currentUser) {
        // Try to force a token refresh first to get latest claims
        await auth.currentUser.getIdToken(true);
        
        // Then reload the user object
        await auth.currentUser.reload();
        
        console.log("Email verified status:", auth.currentUser.emailVerified);
        
        // Double check with the server
        if (auth.currentUser.emailVerified) {
          toast({
            title: "Email verificado",
            description: "Seu email foi verificado com sucesso. Redirecionando...",
          });
          
          // Redirect after verification
          setTimeout(() => {
            router.push('/login/redirect');
          }, 1000);
        } else {
          // Try one more time after a short delay
          setTimeout(async () => {
            try {
              if (auth.currentUser) {
                await auth.currentUser.reload();
                
                if (auth.currentUser.emailVerified) {
                  toast({
                    title: "Email verificado",
                    description: "Seu email foi verificado com sucesso. Redirecionando...",
                  });
                  
                  // Redirect after verification
                  setTimeout(() => {
                    router.push('/login/redirect');
                  }, 1000);
                } else {
                  toast({
                    title: "Não verificado",
                    description: "Seu email ainda não foi verificado. Por favor, verifique sua caixa de entrada e tente novamente.",
                  });
                }
              }
            } catch (error) {
              console.error("Error in delayed verification check:", error);
            } finally {
              setVerifying(false);
            }
          }, 2000);
          
          return; // We'll set verifying to false in the delayed check
        }
      } else {
        toast({
          title: "Usuário não conectado",
          description: "Por favor, faça login novamente para verificar seu email.",
        });
        
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (error) {
      console.error("Error during verification check:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao verificar seu email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      if (auth.currentUser?.emailVerified) {
        setVerifying(false);
      }
      // Otherwise we'll set it to false in the delayed check
    }
  };
  
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout 
      showResendEmailLink={true}
      userEmail={email}
      onResendVerification={handleResendVerification}
    >
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-main">
            <Mail className="h-8 w-8 text-blank" />
          </div>
          <h1 className="text-2xl font-bold text-center font-raleway">Verificação de Email</h1>
        </div>
        
        <div className="p-4 rounded text-sm">
          <p className="mb-2">
            <span className="font-semibold font-raleway">Um email de verificação foi enviado para</span>{' '}
            <span className="font-mono bg-white px-1 py-0.5 rounded">{email}</span>
          </p>
          <p className='font-raleway'>
            Por questões de segurança, você precisa verificar seu email antes de acessar a plataforma.
            Por favor, verifique sua caixa de entrada e clique no link de verificação.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            variant="default"
            onClick={handleManualVerification}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 py-2 bg-mainStrongGreen font-raleway font-bold"
          >
            <ShieldCheck className="h-4 w-4" />
            {verifying ? "Verificando..." : "Já verifiquei meu email"}
          </Button>
          
          <div className="text-center text-sm text-gray-500 font-raleway">
            <span>Voltar para o </span>
            <button 
              onClick={() => router.push('/login')}
              className="text-primary underline hover:text-primary/80"
            >
              login
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}