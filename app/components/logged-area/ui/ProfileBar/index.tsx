'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { UserNavbar } from './components/UserNavbar';
import { UserNotFound } from './components/UserNotFound';
import { signOut } from 'firebase/auth';
import { auth, markFirestoreListenersInactive, db } from '@/lib/firebaseConfig';
import { disableNetwork, enableNetwork } from 'firebase/firestore';

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
            
            try {
                // Force disconnect Firestore
                await disableNetwork(db);
            } catch (e) {
                console.log("Error disabling network:", e);
                // Non-critical, continue
            }
            
            // Navigate away from protected routes
            router.push('/');
            
            // Sign out with a small delay
            setTimeout(async () => {
                try {
                    await signOut(auth);
                    
                    // Re-enable network after sign out
                    await enableNetwork(db);
                    
                    toast({
                        title: "Logout realizado",
                        description: "Você foi desconectado com sucesso",
                    });
                } catch (innerError) {
                    console.error('Error in sign out process:', innerError);
                    // Re-enable network even on error
                    try {
                        await enableNetwork(db);
                    } catch (networkError) {
                        console.log("Error re-enabling network:", networkError);
                    }
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
    
    if (!userData) return <UserNotFound />;
    
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