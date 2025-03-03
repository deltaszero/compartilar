'use client';

import { UserProvider } from '@/context/userContext';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserProvider>{children}</UserProvider>;
}