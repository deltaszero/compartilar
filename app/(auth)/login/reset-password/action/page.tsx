'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, Shield, Check, X, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

import { auth } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthLayout } from '../../components/AuthLayout';

// Schema for new password form
const passwordResetSchema = z.object({
  password: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, "Deve incluir maiúsculas, minúsculas e números"),
  confirmPassword: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function PasswordResetActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract the action code from URL parameters
  useEffect(() => {
    const code = searchParams.get('oobCode');
    
    if (!code) {
      setResetError(true);
      setVerifying(false);
      toast({
        title: "Erro de Verificação",
        description: "Código de redefinição de senha inválido ou expirado.",
        variant: "destructive",
      });
      return;
    }
    
    setActionCode(code);
    
    // Verify the action code
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, code);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        console.error("Error verifying reset code:", error);
        setResetError(true);
        setVerifying(false);
        toast({
          title: "Código Inválido",
          description: "O link de redefinição de senha é inválido ou expirou. Por favor, solicite um novo link.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    verifyCode();
  }, [searchParams, toast]);

  const handlePasswordReset = async (data: PasswordResetFormValues) => {
    if (!actionCode) {
      toast({
        title: "Erro",
        description: "Código de redefinição não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Confirm the password reset with the new password
      await confirmPasswordReset(auth, actionCode, data.password);
      
      setResetComplete(true);
      toast({
        title: "Senha Redefinida",
        description: "Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.",
      });
    } catch (error) {
      console.error("Error confirming password reset:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente ou solicite um novo link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && verifying) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-600">Verificando seu link de redefinição de senha...</p>
        </div>
      </AuthLayout>
    );
  }

  // Show error state
  if (resetError) {
    return (
      <AuthLayout>
        <div className="space-y-6 p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Link Inválido</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded text-sm">
            <p>
              O link de redefinição de senha é inválido ou expirou. 
              Links de redefinição de senha são válidos apenas por um curto período de tempo.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/login/reset-password')}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Solicitar novo link
            </Button>
            
            <Button 
              variant="default" 
              onClick={() => router.push('/login')}
              className="w-full bg-mainStrongGreen"
            >
              Voltar para o login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Show success state
  if (resetComplete) {
    return (
      <AuthLayout>
        <div className="space-y-6 p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Senha Redefinida</h1>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-4 rounded text-sm">
            <p className="mb-2 font-semibold">Sua senha foi atualizada com sucesso!</p>
            <p>
              Você já pode fazer login em sua conta usando sua nova senha.
            </p>
          </div>
          
          <Button 
            variant="default" 
            onClick={() => router.push('/login')}
            className="w-full bg-mainStrongGreen"
          >
            Ir para o login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Show password reset form
  return (
    <AuthLayout>
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-main/30">
            <Key className="h-8 w-8 text-main" />
          </div>
          <h1 className="text-2xl font-bold text-center font-raleway">Criar Nova Senha</h1>
        </div>
        
        {email && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p className="font-semibold">Redefinindo senha para:</p>
            <p className="font-mono">{email}</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        className="pl-10"
                        disabled={loading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        className="pl-10"
                        disabled={loading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
              <Shield size={16} className="text-main mt-0.5 flex-shrink-0" />
              <span>
                Sua senha deve ter pelo menos 8 caracteres e incluir pelo menos uma letra maiúscula, uma minúscula e um número.
              </span>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-mainStrongGreen"
              disabled={loading}
            >
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <Button 
                variant="link" 
                onClick={() => router.push('/login')}
                className="text-sm"
              >
                Cancelar e voltar para o login
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}