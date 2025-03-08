'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Eye, EyeOff, User } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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

    // Function to check if email already exists
    const checkEmailExists = async (email: string): Promise<boolean> => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    };

    // Function to check if username already exists
    const checkUsernameExists = async (username: string): Promise<boolean> => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username.toLowerCase()));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    };

    const handleSignup = async (data: SignupFormValues) => {
        setLoading(true);
        try {
            // First check if email already exists
            const emailExists = await checkEmailExists(data.email);
            if (emailExists) {
                toast({
                    title: "Email já cadastrado",
                    description: "Este email já está sendo usado por outra conta.",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // Then check if username already exists
            const usernameExists = await checkUsernameExists(data.username);
            if (usernameExists) {
                toast({
                    title: "Nome de usuário indisponível",
                    description: "Este nome de usuário já está sendo usado. Por favor escolha outro.",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // Create new user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
            const user = userCredential.user;
            
            // First test write to a simple test collection to verify permissions are working
            try {
                console.log("Testing Firestore permissions...");
                await setDoc(doc(db, 'test_signup', `test_${user.uid}`), {
                    uid: user.uid,
                    timestamp: new Date().toISOString(),
                    testWrite: true
                });
                console.log("Test write successful");
            } catch (testError) {
                console.error("Test write failed:", testError);
                // Continue anyway, we just want to log this
            }

            // Update profile with username
            await updateProfile(user, {
                displayName: data.username
            });

            console.log("Creating user document in Firestore...");
            // Create user document in the users collection
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: data.email,
                    username: data.username.toLowerCase(), // Store username in lowercase for easier lookup
                    displayName: data.username, // Keep original casing for display
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                console.log("User document created successfully");
            } catch (error) {
                console.error("Error creating user document:", error);
                throw error; // Re-throw to be caught by the outer catch block
            }
            
            // Add a small delay to ensure Firestore write completes and auth token is refreshed
            // This helps prevent "Missing or insufficient permissions" errors
            toast({
                title: "Conta criada",
                description: "Redirecionando para sua área...",
            });
            
            console.log("Waiting for Firebase to process everything...");
            // Wait for Firebase to process everything
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log("Refreshing auth token...");
            // Refresh the token to ensure it contains the latest claims
            try {
                await user.getIdToken(true);
                console.log("Auth token refreshed successfully");
            } catch (tokenError) {
                console.error("Error refreshing auth token:", tokenError);
            }
            
            // Redirect to the redirect page
            console.log("Email signup completed, redirecting to redirect page...");
            router.push('/login/redirect');

        } catch (error: unknown) {
            console.error("Signup error:", error);
            let message = "Erro ao criar conta";

            if (error instanceof FirebaseError) {
                console.error("Firebase error code:", error.code);
                console.error("Firebase error message:", error.message);
                
                if (error.code === 'auth/email-already-in-use') {
                    message = "Este email já está em uso";
                } else if (error.code === 'auth/invalid-email') {
                    message = "Email inválido";
                } else if (error.code === 'auth/weak-password') {
                    message = "Senha muito fraca";
                } else if (error.code === 'permission-denied' || error.code === 'firebase/permission-denied') {
                    message = "Erro de permissão ao criar conta. Por favor, tente novamente.";
                } else if (error.code === 'firebase/insufficient-permissions') {
                    message = "Permissões insuficientes para criar conta.";
                } else {
                    message = `Erro: ${error.message}`;
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
            
            // First test write to a simple test collection to verify permissions are working
            try {
                console.log("Testing Google Firestore permissions...");
                await setDoc(doc(db, 'test_signup', `google_test_${user.uid}`), {
                    uid: user.uid,
                    timestamp: new Date().toISOString(),
                    testWrite: true,
                    provider: 'google'
                });
                console.log("Google test write successful");
            } catch (testError) {
                console.error("Google test write failed:", testError);
                // Continue anyway, we just want to log this
            }
            
            // Check if the Google email already exists in our database
            const emailExists = await checkEmailExists(user.email || '');
            
            // Small delay to ensure authentication is fully processed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
                // Get user reference from Firestore
                const userRef = doc(db, 'users', user.uid);
                
                // Extract name information from Google
                const displayName = user.displayName || '';
                const nameParts = displayName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                
                // Create a username from email
                const emailPrefix = user.email?.split('@')[0] || '';
                let baseUsername = emailPrefix.toLowerCase();
                let username = baseUsername;
                
                // Check if the username exists, add a random number if it does
                let usernameExists = await checkUsernameExists(username);
                let attempt = 0;
                
                // If username already exists, try adding random numbers until we find an available one
                while (usernameExists && attempt < 5) {
                    const random = Math.floor(Math.random() * 10000);
                    username = `${baseUsername}${random}`;
                    usernameExists = await checkUsernameExists(username);
                    attempt++;
                }
                
                console.log("Creating user document for Google sign-in...");
                // Create user document in Firestore
                try {
                    await setDoc(userRef, {
                        uid: user.uid,
                        email: user.email,
                        username: username,
                        displayName: displayName || username, // Use Google display name or username
                        firstName: firstName,
                        lastName: lastName,
                        photoURL: user.photoURL,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    console.log("Google user document created successfully");
                } catch (docError) {
                    console.error("Error creating Google user document:", docError);
                    throw docError;
                }
                
                toast({
                    title: emailExists ? "Login efetuado" : "Conta criada",
                    description: "Redirecionando para sua área...",
                });
                
                console.log("Waiting for Google Firebase to process everything...");
                // Wait for Firebase to process everything - increased delay for Google auth
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log("Refreshing Google auth token...");
                // Refresh the token to ensure it contains the latest claims
                try {
                    await user.getIdToken(true);
                    console.log("Google auth token refreshed successfully");
                } catch (tokenError) {
                    console.error("Error refreshing Google auth token:", tokenError);
                }
            } catch (firestoreError) {
                console.error("Error saving user data to Firestore:", firestoreError);
                toast({
                    title: "Aviso",
                    description: "Autenticado com sucesso, mas ocorreu um erro ao salvar seus dados. Algumas funcionalidades podem estar limitadas.",
                });
                // Continue with signup even if saving user data fails
                // The user is still authenticated at this point
            }
            
            // Redirect to the redirect page
            console.log("Google signup completed, redirecting to redirect page...");
            router.push('/login/redirect');
        } catch (error: unknown) {
            console.error("Google signup error:", error);
            let message = "Erro ao criar conta com Google";
            
            if (error instanceof FirebaseError) {
                console.error("Google Firebase error code:", error.code);
                console.error("Google Firebase error message:", error.message);
                
                if (error.code === 'auth/popup-closed-by-user') {
                    message = "Cadastro cancelado pelo usuário";
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    message = "Este email já está em uso com outro método de login";
                } else if (error.code === 'auth/operation-not-allowed') {
                    message = "Autenticação com Google não está habilitada. Contate o administrador.";
                } else if (error.code === 'auth/popup-blocked') {
                    message = "Bloqueador de pop-ups impediu a autenticação. Permita pop-ups e tente novamente.";
                } else if (error.code === 'permission-denied' || error.code === 'firebase/permission-denied') {
                    message = "Erro de permissão ao criar conta com Google. Por favor, tente novamente.";
                } else if (error.code === 'firebase/insufficient-permissions') {
                    message = "Permissões insuficientes para criar conta com Google.";
                } else if (error.message && error.message.includes('stream token')) {
                    message = "Erro de conexão com Firebase. Tente novamente em alguns instantes.";
                } else {
                    message = `Erro Google: ${error.message}`;
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