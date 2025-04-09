'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@/lib/firebaseConfig';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthLayout } from '../components/AuthLayout';

// Schema for password reset form
const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, "O email é obrigatório")
    .email("Formato de email inválido"),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [securityMessage, setSecurityMessage] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      // Normalize email to lowercase for consistency
      const normalizedEmail = data.email.toLowerCase();
      
      // Configure the action URL to our custom page
      const actionCodeSettings = {
        // URL must be absolute
        url: `${window.location.origin}/login/reset-password/action`,
        // This must be true for email link sign-in
        handleCodeInApp: true,
      };
      
      // Send password reset email with our custom settings
      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      
      // Set email sent status to true for UI update
      setEmailSent(true);
      
      // Security best practice: always show success even if email doesn't exist
      toast({
        title: "Email enviado",
        description: "Se existir uma conta com este email, você receberá um link para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);

      // Don't reveal if user exists or not
      if (error.code === 'auth/user-not-found') {
        // Still show success message for security reasons
        setEmailSent(true);
        toast({
          title: "Email enviado",
          description: "Se existir uma conta com este email, você receberá um link para redefinir sua senha.",
        });
      } else if (error.code === 'auth/invalid-email') {
        form.setError('email', { 
          type: 'manual', 
          message: 'Email inválido. Por favor, verifique o formato.' 
        });
        toast({
          title: "Erro",
          description: "Por favor, verifique o formato do email.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/too-many-requests') {
        setSecurityMessage(true);
        toast({
          title: "Muitas tentativas",
          description: "Por motivos de segurança, tente novamente mais tarde.",
          variant: "destructive",
        });
      } else {
        // Generic error
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao tentar enviar o email. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // If email has been sent, show confirmation
  if (emailSent) {
    return (
      <AuthLayout>
        <div className="space-y-6 p-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-mainStrongGreen/20">
              <Mail className="h-8 w-8 text-mainStrongGreen" />
            </div>
            <h1 className="text-2xl font-bold text-center">Redefinição de Senha</h1>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-4 rounded text-sm">
            <p className="mb-2 font-semibold">Email enviado com sucesso!</p>
            <p>
              Verifique sua caixa de entrada para o link de redefinição de senha.
              Se não receber em alguns minutos, verifique sua pasta de spam.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/login')}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-main">
            <Mail className="h-8 w-8 text-blank" />
          </div>
          <h1 className="text-2xl font-bold text-center font-raleway">Esqueceu sua senha?</h1>
        </div>
        
        <p className="text-center text-sm text-gray-600 font-raleway">
          Digite seu email abaixo e enviaremos um link para redefinição de senha.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4 font-raleway">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Seu email de cadastro"
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
            
            {securityMessage && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
                <span>
                  Detectamos muitas tentativas. Por motivos de segurança, aguarde alguns minutos antes de tentar novamente.
                </span>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-mainStrongGreen font-raleway font-bold"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
            
            <div className="flex justify-center font-raleway">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="text-sm text-primary underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para o login
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}