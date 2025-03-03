import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import IconBell from '@assets/icons/icon_meu_lar_bell.svg';

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
}

const UserNavbar = ({ pathname, onBackClick }: UserNavbarProps) => {
    return (
        <header className="border-b bg-background sticky top-0 z-30 w-full">
            <div className="relative flex h-14 items-center px-4 md:px-6">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full w-9 h-9 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        onClick={onBackClick}
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-xl md:text-2xl font-medium font-playfair text-foreground">
                        {pathname}
                    </h1>
                </div>
                
                {/* Notification Bell - Positioned at Top Right */}
                <div className="absolute right-4 md:right-6 top-2">                
                    <button 
                        type="button"
                        className="relative bg-transparent border-none cursor-pointer p-0 focus:outline-none"
                    >
                        <IconBell width={32} height={32} />
                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground ring-1 ring-background">
                            9+
                        </span>
                        <span className="sr-only">Notifications</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

const UserNotFound = () => (
    <header className="border-b bg-background sticky top-0 z-30">
        <div className="relative flex h-14 items-center px-4 md:px-6">
            <div className="flex items-center gap-3 flex-shrink-0">
                <h1 className="text-xl md:text-2xl font-medium font-playfair text-foreground">
                    Error
                </h1>
            </div>
            
            <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2">
                <p className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-md">
                    User not found
                </p>
            </div>
        </div>
    </header>
);

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
        />
    );
}

export default UserProfileBar;