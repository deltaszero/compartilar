'use client';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Settings, Home, LogOut } from "lucide-react";
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
    userData: { 
        username: string; 
        photoURL?: string; 
    };
    onSignOut: () => void;
}

/**
 * UserMenu component for the user dropdown
 */
export const UserMenu = ({ userData, onSignOut }: UserMenuProps) => (
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