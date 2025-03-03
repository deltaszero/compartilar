'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Bell, Camera, Settings, Home, LogOut } from "lucide-react";
import { cn } from '@/app/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

interface UserNavbarProps {
    pathname: string;
    onBackClick?: () => void;
    userData: {
        username: string;
        photoURL?: string;
    } | null;
}

/**
 * NotificationBell component for displaying notifications
 */
const NotificationBell = () => (
    <Button 
        variant="neutral" 
        size="icon"
        className="relative h-9 w-9 rounded-md"
    >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondaryMain text-[10px] font-medium text-primary-foreground ring-1 ring-background">
            9+
        </span>
        <span className="sr-only">Notifications</span>
    </Button>
);

/**
 * UserMenu component for the user dropdown
 */
const UserMenu = ({ userData, onSignOut }: {
    userData: { username: string; photoURL?: string; },
    onSignOut: () => void
}) => (
    <div className="flex items-center gap-2">
        {/* Username - hidden on mobile */}
        <span className="hidden sm:block text-lg font-medium">
            {userData.username}
        </span>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-primary">
                        {userData.photoURL ? (
                            <AvatarImage src={userData.photoURL} alt="Avatar" />
                        ) : (
                            <AvatarFallback className="bg-primary-foreground text-primary">
                                <Camera className="h-5 w-5" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                    <Link href={`/${userData.username}/home`} className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/${userData.username}/settings`} className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSignOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);

/**
 * Main UserNavbar component
 */
const UserNavbar = ({ pathname, onBackClick, userData }: UserNavbarProps) => {
    const router = useRouter();
    
    const handleSignOut = async () => {
        try {
            // Add your signout logic here
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    return (
        <header className={cn(
            "flex items-center justify-between bg-bg py-3 px-4 md:px-6",
            "border-b sticky top-0 z-30 w-full"
        )}>
            <div className="flex items-center gap-3">
                <Button 
                    variant="default"
                    size="icon" 
                    className="rounded-full w-9 h-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={onBackClick}
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">
                    {pathname}
                </h1>
            </div>
            
            {/* Right section with notifications and user menu */}
            {userData && (
                <div className="flex items-center gap-2">
                    <UserMenu 
                        userData={userData} 
                        onSignOut={handleSignOut} 
                    />
                    <NotificationBell />
                </div>
            )}
        </header>
    );
};

/**
 * UserNotFound component for when user data is missing
 */
const UserNotFound = () => (
    <header className={cn(
        "flex items-center justify-between bg-bg py-3 px-4 md:px-6",
        "border-b sticky top-0 z-30 w-full"
    )}>
        <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-medium text-foreground">
                Error
            </h1>
        </div>
        
        <div className="flex items-center">
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-md">
                User not found
            </p>
        </div>
    </header>
);

/**
 * UserProfileBar is the main exported component
 */
const UserProfileBar = ({ pathname }: { pathname: string }) => {
    const { userData } = useUser();
    const router = useRouter();
    
    const handleBackClick = () => {
        router.back();
    };
    
    if (!userData) return <UserNotFound />;
    
    return (
        <UserNavbar 
            pathname={pathname} 
            onBackClick={handleBackClick}
            userData={userData}
        />
    );
};

export default UserProfileBar;