'use client';

import React from 'react';
import { UserProvider } from '@/context/userContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}