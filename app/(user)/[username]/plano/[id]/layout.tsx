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

    return (
        <div className="flex flex-col min-h-screen bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-main to-bg">
            <UserProfileBar pathname={plan?.title || 'Plano Parental'} />

            <div className="p-3 flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button
                        variant={null}
                        size="sm"
                        className="mr-2"
                        onClick={handleBackClick}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Voltar</span>
                    </Button>

                    <h1 className="text-2xl sm:text-3xl font-bold font-raleway">
                        {plan?.title || 'Plano Parental'}
                    </h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar - Hidden on mobile */}
                <div className="hidden lg:block shrink-0">
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