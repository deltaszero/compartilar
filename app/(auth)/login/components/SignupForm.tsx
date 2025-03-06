'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            // Configure the Google provider to request necessary scopes
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            // Set custom parameters for a better UX
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // Sign in with popup
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Small delay to ensure authentication is fully processed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
                // Get user reference from Firestore
                const userRef = doc(db, 'account_info', user.uid);
                
                // Extract name information from Google
                const displayName = user.displayName || '';
                const nameParts = displayName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                
                // Create a username from email
                const emailPrefix = user.email?.split('@')[0] || '';
                let username = emailPrefix.toLowerCase();
                
                // Create user document in Firestore
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    username: username,
                    firstName: firstName,
                    lastName: lastName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                
                // Save username reference for lookup
                const usernameRef = doc(db, 'usernames', username);
                await setDoc(usernameRef, { uid: user.uid });
                
                toast({
                    title: "Conta criada",
                    description: "Sua conta foi criada com sucesso!",
                });
            } catch (firestoreError) {
                console.error("Error saving user data to Firestore:", firestoreError);
                // Continue with signup even if saving user data fails
                // The user is still authenticated at this point
            }
            
            router.push('/login/redirect');
        } catch (error: unknown) {
            console.error("Google signup error:", error);
            let message = "Erro ao criar conta com Google";
            
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/popup-closed-by-user') {
                    message = "Cadastro cancelado pelo usuário";
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    message = "Este email já está em uso com outro método de login";
                } else if (error.code === 'auth/operation-not-allowed') {
                    message = "Autenticação com Google não está habilitada. Contate o administrador.";
                } else if (error.code === 'auth/popup-blocked') {
                    message = "Bloqueador de pop-ups impediu a autenticação. Permita pop-ups e tente novamente.";
                } else if (error.message && error.message.includes('stream token')) {
                    message = "Erro de conexão com Firebase. Tente novamente em alguns instantes.";
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
                    variant="default" 
                    className="w-full bg-mainStrongGreen"
                    disabled={loading}
                >
                    {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
                
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 text-gray-500">ou continuar com</span>
                    </div>
                </div>
                
                <Button 
                    type="button" 
                    variant="default" 
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-mainStrongGreen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </Button>
            </form>
        </Form>
    );
}