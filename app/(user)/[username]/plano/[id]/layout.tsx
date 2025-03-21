'use client';

import { use } from 'react';
import { PlanProvider } from './context';
import PlanSidebar from '../components/PlanSidebar';
import { useUser } from '@/context/userContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PlanLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string; username: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useUser();
  const router = useRouter();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PlanProvider planId={resolvedParams.id}>
      <div className="flex h-full">
        <PlanSidebar planId={resolvedParams.id} username={resolvedParams.username} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </PlanProvider>
  );
}