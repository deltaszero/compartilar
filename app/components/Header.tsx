'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogIn, Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/app/lib/utils';
import { useUser } from '@/context/userContext';
import { signOut } from 'firebase/auth';
import { auth, markFirestoreListenersInactive } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';

/**
 * navItems is an array of objects containing the label and href of each navigation item.
 */
const navItems = [
    { label: 'Descomplique',   href: '#descomplique' },
    { label: 'Organize',       href: '#organize' },
    { label: 'Proteja',        href: '#proteja' },
    { label: 'Despreocupe-se', href: '#despreocupe-se' }
];

/**
 * MobileNav is a component that renders the mobile navigation menu.
 */
const MobileNav = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant={null} className="lg:hidden px-0 ">
        <div className="flex flex-row items-center gap-2">
          <Menu className="h-6 w-6" />
          <h1 className="text-2xl font-bold uppercase">CompartiLar</h1>
        </div>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-[250px] sm:w-[300px] z-[999]">
      <SheetTitle className="text-2xl font-bold uppercase">CompartiLar</SheetTitle>
      <div className="flex flex-col gap-4 mt-8">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="py-2 px-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </SheetContent>
  </Sheet>
);

/**
 * DesktopNav is a component that renders the desktop navigation menu.
 */
const DesktopNav = () => (
  <nav className="hidden lg:flex space-x-4">
    {navItems.map((item) => (
      <Link 
        key={item.label} 
        href={item.href}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "px-3 py-2 hover:bg-accent hover:text-accent-foreground z-[99]"
        )}
      >
        {item.label}
      </Link>
    ))}
  </nav>
);

/**
 * UserMenu is a component that renders the user menu.
 */
const UserMenu = ({ userData, onSignOut }: {
    userData: { username: string; photoURL?: string },
    onSignOut: () => void
}) => (
  <div className="flex items-center gap-2 relative">
    {/* username */}
    <Link href={`/${userData.username}/home`} className="hidden sm:block text-lg">
      {userData.username}
    </Link>
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={null} className="relative h-9 w-9 rounded-full p-0">
          <Avatar className="h-9 w-9">
            {userData.photoURL ? (
              <AvatarImage src={userData.photoURL} alt="Avatar" />
            ) : (
              <AvatarFallback>
                <Camera className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-[1000]" forceMount>
        <DropdownMenuItem asChild>
          <Link href={`/${userData.username}/home`}>Perfil</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem asChild>
          <Link href={`/${userData.username}/settings`}>Configurações</Link>
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={onSignOut} className="focus:text-red-500 flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

/**
 * LoginButton is a component that renders the login button.
 */
const LoginButton = () => (
  <Button asChild variant="default" className="bg-mainStrongGreen">
    <Link href="/login" className="font-bold gap-2 flex items-center">
      <span>Entrar</span>
      <LogIn className="h-4 w-4 ml-2" />
    </Link>
  </Button>
);

/**
 * Header is a component that renders the website header.
 */
const Header = () => {
    const router = useRouter();
    const { user, userData, loading } = useUser();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            // Mark listeners as inactive to prevent further updates
            markFirestoreListenersInactive();
            
            // Navigate away from protected routes immediately
            router.push('/');
            
            if (user) {
                try {
                    // Get the current ID token
                    const idToken = await user.getIdToken();
                    
                    // Call the logout API to revoke tokens server-side
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    // Sign out client-side regardless of server response
                    await signOut(auth);
                    
                    toast({
                        title: "Logout realizado",
                        description: "Você foi desconectado com sucesso",
                    });
                } catch (innerError) {
                    console.error('Error in sign out process:', innerError);
                    
                    // Still attempt to sign out client-side
                    try {
                        await signOut(auth);
                    } catch (signOutError) {
                        console.error('Error in client sign out:', signOutError);
                    }
                }
            }
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                variant: "destructive",
                title: "Erro ao sair",
                description: "Ocorreu um erro ao tentar sair. Tente novamente.",
            });
        }
    };

    return (
        <header className="flex items-center justify-between bg-bg py-4 px-2 sm:px-6 lg:fixed lg:inset-x-0 lg:top-0 z-[99]">
            <div className="flex items-center">
                <MobileNav />
                <div className="hidden lg:block">
                    <h1 className="text-2xl font-bold uppercase">CompartiLar</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DesktopNav />
                <div className="mx-2"></div>
                {loading ? (
                    <div className="h-8 w-32 rounded-md bg-gray-200 animate-pulse" />
                ) : user && userData ? (
                    <UserMenu userData={userData} onSignOut={handleSignOut} />
                ) : (
                    <LoginButton />
                )}
            </div>
        </header>
    );
};

export default Header;