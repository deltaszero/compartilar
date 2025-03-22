'use client';

import { use, useState } from 'react';
import { PlanProvider } from './context';
import PlanSidebar from '../components/PlanSidebar';
import { useUser } from '@/context/userContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { usePlan } from './context';
import { ArrowLeft, Menu, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { planSections } from '../types';

// Loading component for better aesthetics
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-bg">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-primary"></div>
      <p className="text-muted-foreground font-medium animate-pulse">Carregando plano parental...</p>
    </div>
  </div>
);

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
    return <LoadingScreen />;
  }

  return (
    <PlanProvider planId={resolvedParams.id}>
      <PlanLayoutContent 
        username={resolvedParams.username} 
        planId={resolvedParams.id}
      >
        {children}
      </PlanLayoutContent>
    </PlanProvider>
  );
}

// Separate component to access the plan context
function PlanLayoutContent({ 
  children, 
  username,
  planId
}: { 
  children: React.ReactNode;
  username: string;
  planId: string;
}) {
  const { plan, isLoading } = usePlan();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBackClick = () => {
    router.push(`/${username}/plano`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Calculate completion percentage
  const completedSections = Object.keys(plan?.sections || {});
  const completionPercentage = Math.round((completedSections.length / planSections.length) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <UserProfileBar pathname={plan?.title || 'Plano Parental'} />
      
      <div className="p-3 flex items-center justify-between border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="mr-2"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Voltar</span>
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold truncate max-w-[150px] sm:max-w-xs">
            {plan?.title || 'Plano Parental'}
          </h1>
        </div>

        {/* Mobile Progress Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-main/10 rounded-full px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3 text-main mr-1" />
            <span className="text-xs font-medium text-main">{completionPercentage}%</span>
          </div>

          {/* Mobile Sidebar Toggle */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="ml-2 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] sm:w-[350px]">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-bold">Seções do Plano</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progresso geral</span>
                  <span className="text-xs font-medium bg-main/10 text-main px-2 py-0.5 rounded-full">
                    {completionPercentage}% completo
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-main h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <PlanSidebar 
                planId={planId} 
                username={username} 
                completedSections={completedSections}
                onNavigate={() => setSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-[280px] border-r shrink-0">
          <PlanSidebar 
            planId={planId} 
            username={username} 
            completedSections={completedSections}
          />
        </div>
        <div className="flex-1 overflow-auto pb-20">{children}</div>
      </div>
    </div>
  );
}