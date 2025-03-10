'use client';

import { UserProvider } from '@/context/userContext';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <UserProvider>{children}</UserProvider>;
}