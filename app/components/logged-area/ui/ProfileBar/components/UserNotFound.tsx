'use client';

import { cn } from '@/app/lib/utils';

/**
 * UserNotFound component for when user data is missing
 */
export const UserNotFound = () => (
    <header className={cn(
        "flex items-center justify-between bg-bg py-3 px-4 md:px-6",
        "border-b sticky top-0 z-[999] w-full"
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