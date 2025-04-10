'use client';

import { cn } from '@/app/lib/utils';
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FriendSearch } from './FriendSearch';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { UserNavbarProps } from '../types';

/**
 * Main UserNavbar component
 */
export const UserNavbar = ({ pathname, onBackClick, userData, onSignOut }: UserNavbarProps) => {
    return (
        <header className={cn(
            "flex items-start justify-between py-4 px-2 sm:px-6",
            // "sticky top-0 z-[999] w-full gap-2"
            "w-full gap-2"
        )}>
            <div className="flex items-start min-w-[44px]">
                {onBackClick && (
                    <Button 
                        variant="default"
                        size="icon" 
                        className="bg-bw rounded-md w-9 h-9 hover:bg-muted hover:text-foreground"
                        onClick={onBackClick}
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        <span className="sr-only">Voltar</span>
                    </Button>
                )}
            </div>
            
            {/* Center section with search */}
            {userData && (
                <div className="w-full flex items-center justify-center">
                    <FriendSearch userData={userData} />
                </div>
            )}
            
            {/* Right section with user menu and notifications */}
            {userData && (
                <div className="flex items-start gap-4">
                    {/* <UserMenu 
                        userData={userData} 
                        onSignOut={onSignOut || (() => {})}
                    /> */}
                    <NotificationBell />
                </div>
            )}
        </header>
    );
};