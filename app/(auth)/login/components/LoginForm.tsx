'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { loginSchema, LoginFormValues } from './schemas';

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleLogin = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            router.push('/login/redirect');
        } catch (error: unknown) {
            console.error(error);
            let message = "Erro ao fazer login";

            if (error instanceof FirebaseError) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    message = "Email ou senha incorretos";
                } else if (error.code === 'auth/too-many-requests') {
                    message = "Muitas tentativas. Tente novamente mais tarde";
                }
            }

            toast({
                title: "Erro",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Seu email"
                                        className="pl-10"
                                        {...field}
                                        disabled={loading}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Sua senha"
                                        className="pl-10"
                                        {...field}
                                        disabled={loading}
                                    />
                                    <Button
                                        type="button"
                                        variant="noShadow"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="bg-mainStrongGreen w-full"
                    disabled={loading}
                >
                    {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="text-sm text-center font-raleway">
                    <Link href="/reset-password" className="text-primary hover:underline">
                        Esqueceu a senha?
                    </Link>
                </div>
            </form>
        </Form>
    );
}