'use client';

import { useUser } from '@context/userContext';
import { useRouter } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import UserProfileBar from '../ProfileBar';

/**
 * This is a re-export of ProfileBar to maintain backward compatibility
 */
export default ({ pathname }: { pathname: string }) => {
    return <UserProfileBar pathname={pathname} />;
};