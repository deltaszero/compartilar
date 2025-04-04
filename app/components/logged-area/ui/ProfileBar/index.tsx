'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { UserNavbar } from './components/UserNavbar';
import { signOut } from 'firebase/auth';
import { auth, markFirestoreListenersInactive } from '@/lib/firebaseConfig';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * UserProfileBar is the main exported component
 */
const UserProfileBar = ({ pathname }: { pathname: string }) => {
    const { userData } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    
    const handleBackClick = () => {
        router.back();
    };
    
    const handleSignOut = async () => {
        try {
            // First, mark all listeners as inactive
            markFirestoreListenersInactive();
            
            // Navigate away from protected routes
            router.push('/');
            
            // Sign out with a small delay
            setTimeout(async () => {
                try {
                    // Sign out from Firebase Auth
                    await signOut(auth);
                    
                    // Call the logout API endpoint
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    
                    toast({
                        title: "Logout realizado",
                        description: "Você foi desconectado com sucesso",
                    });
                } catch (innerError) {
                    console.error('Error in sign out process:', innerError);
                }
            }, 100);
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                variant: "destructive",
                title: "Erro ao sair",
                description: "Ocorreu um erro ao tentar sair. Tente novamente.",
            });
        }
    };
    
    if (!userData) {
        return (
            <header className="flex items-start justify-between py-4 px-2 sm:px-6 w-full gap-2">
                <div className="flex items-start min-w-[44px]">
                    <Skeleton className="w-9 h-9 rounded-md" />
                </div>
                
                <div className="mx-2 flex-1">
                    <Skeleton className="w-full h-10 rounded-md" />
                </div>
                
                <div className="flex items-start gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-10 h-10 rounded-md" />
                </div>
            </header>
        );
    }
    
    return (
        <>
            <UserNavbar 
                pathname={pathname} 
                onBackClick={handleBackClick}
                userData={userData}
                onSignOut={handleSignOut}
            />
            <Toaster />
        </>
    );
};

export default UserProfileBar;