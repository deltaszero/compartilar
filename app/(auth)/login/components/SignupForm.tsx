'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { auth, db } from '@/lib/firebaseConfig';
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

import { signupSchema, SignupFormValues } from './schemas';

export function SignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleSignup = async (data: SignupFormValues) => {
        setLoading(true);
        try {
            // Create new user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
            const user = userCredential.user;

            // Update profile with username
            await updateProfile(user, {
                displayName: data.username
            });

            // Create account info doc
            await setDoc(doc(db, 'account_info', user.uid), {
                uid: user.uid,
                email: data.email,
                username: data.username,
                createdAt: new Date(),
            });

            // Create username doc for uniqueness
            await setDoc(doc(db, 'usernames', data.username), {
                uid: user.uid,
                createdAt: new Date()
            });

            // Redirect
            router.push('/login/redirect');

        } catch (error: unknown) {
            console.error(error);
            let message = "Erro ao criar conta";

            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    message = "Este email já está em uso";
                } else if (error.code === 'auth/invalid-email') {
                    message = "Email inválido";
                } else if (error.code === 'auth/weak-password') {
                    message = "Senha muito fraca";
                } else if (error.code === 'permission-denied') {
                    message = "Este nome de usuário já está em uso";
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
            <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
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
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome de usuário</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Seu nome de usuário"
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
                                        placeholder="Crie uma senha"
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

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirmar senha</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirme sua senha"
                                        className="pl-10"
                                        {...field}
                                        disabled={loading}
                                    />
                                    <Button
                                        type="button"
                                        variant="noShadow"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
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
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
            </form>
        </Form>
    );
}