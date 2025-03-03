'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, KeyRound, User } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

import { auth, db } from '@/lib/firebaseConfig';
import { CustomTypingEffect } from '@/app/components/CustomTypingEffect';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import background_img from "@assets/images/e7f07729-4789-4da8-bfc4-241153ee5040_0.png";

import CompartilarLogo from '@/app/assets/icons/compartilar-icon.svg';

// Login form schema
const loginSchema = z.object({
    email: z.string().email("Digite um email válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// Signup form schema
const signupSchema = z.object({
    email: z.string().email("Digite um email válido"),
    username: z
        .string()
        .min(3, "O nome de usuário deve ter no mínimo 3 caracteres")
        .max(20, "O nome de usuário deve ter no máximo 20 caracteres")
        .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, _ ou -")
        .toLowerCase(),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState("login");
    const [hasHydrated, setHasHydrated] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    // Login form
    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Signup form
    const signupForm = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
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
        <div className="h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Sidebar */}
            <div className="hidden lg:flex relative w-full h-full text-4xl bg-primary text-primary-foreground">
                {/* Background Image */}
                <Image
                    src={background_img}
                    alt="Background"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                    unoptimized
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gray-900 opacity-90" />
                {/* Typing Effect on Top */}
                <div className="hidden sm:flex sm:flex-col sm:font-playfair sm:relative sm:z-10 sm:justify-center sm:items-center sm:w-full sm:h-full">
                    <CustomTypingEffect />
                </div>
            </div>
            {/* Right Content */}
            <div className="flex flex-col bg-bg py-4">
                <div className="flex flex-col items-center justify-center">
                    <Link href="/" className="w-10 h-10 text-primary hover:text-primary/80 transition-colors">
                        <CompartilarLogo width={60} height={60} className="flex-shrink-0 text-main" />
                    </Link>
                </div>
                <section className="flex-1 flex flex-col justify-center items-center">
                    <div className='flex flex-col gap-4 mb-[6em] max-w-xs sm:max-w-md'>
                        <div className='font-playfair font-semibold text-4xl sm:text-6xl'>
                            <p>Coparentalidade</p>
                            <p>sintonizada</p>
                        </div>
                        <div className='font-raleway text-muted-foreground'>
                            <p>Plataforma de gerencimento familiar que facilita a convivência em lares alternados.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
                        {hasHydrated ? (
                            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full">
                                    <TabsTrigger value="login">Entrar</TabsTrigger>
                                    <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                                </TabsList>

                                {/* Login Tab */}
                                <TabsContent value="login" className="mt-4">
                                    <Form {...loginForm}>
                                        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                                            <FormField
                                                control={loginForm.control}
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
                                                control={loginForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Senha</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    type={showLoginPassword ? 'text' : 'password'}
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
                                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                                >
                                                                    {showLoginPassword ? (
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
                                                {loading ? "Entrando..." : "Entrar"}
                                            </Button>

                                            <div className="text-sm text-center font-raleway">
                                                <Link href="/reset-password" className="text-primary hover:underline">
                                                    Esqueceu a senha?
                                                </Link>
                                            </div>
                                        </form>
                                    </Form>
                                </TabsContent>

                                {/* Signup Tab */}
                                <TabsContent value="signup" className="mt-4">
                                    <Form {...signupForm}>
                                        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                                            <FormField
                                                control={signupForm.control}
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
                                                control={signupForm.control}
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
                                                control={signupForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Senha</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    type={showSignupPassword ? 'text' : 'password'}
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
                                                                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                                >
                                                                    {showSignupPassword ? (
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
                                                control={signupForm.control}
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
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="w-full h-48 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        <Toaster />
                    </div>
                </section>
            </div>
        </div>
    );
}