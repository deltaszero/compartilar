// app/components/logged-area/ui/Sidebar.tsx
'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@context/userContext';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWindowSize } from '@/hooks/useWindowSize';
import { SubscriptionButton } from './SubscriptionButton';
import { Sparkles } from 'lucide-react';

// importing assets
import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
import IconPlan from '@assets/icons/icon_meu_lar_plan.svg';
import IconCalendar from '@assets/icons/icon_meu_lar_calendar.svg';
import IconFinance from '@assets/icons/icon_meu_lar_finance.svg';
// import IconHandshake from '@assets/icons/icon_meu_lar_handshake.svg';
import IconMaplocation from '@assets/icons/bottom_bar_maplocation.svg';
import IconChat from '@assets/icons/icon_meu_lar_chat.svg';
import IconSettings from '@assets/icons/icon_meu_lar_settings.svg';

import CompartilarLogo from '@/app/assets/icons/compartilar-icon.svg';

// animation variants
const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            when: "beforeChildren",
            staggerChildren: 0.1
        }
    }
};

// Avoid using x/y transforms when used inside BottomNav
const mobileVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            when: "beforeChildren",
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

const mobileItemVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

interface NavItemProps {
    href: string;
    currentPath: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    subpages?: Array<{
        path: string;
        label: string;
    }>;
    isMobile?: boolean;
}

interface SidebarProps {
    isBottomNavModal?: boolean;
}

/**
 * Navigation Item Component with subtle brutalist styling
 */
const NavItem = ({ href, currentPath, icon, children, subpages, isMobile = false }: NavItemProps) => {
    const isActive = currentPath === href;
    const isSubpageActive = subpages?.some(subpage => currentPath === subpage.path);
    const hasSubpages = subpages && subpages.length > 0;

    return (
        <div className={isMobile ? "mb-2" : "mb-3 mx-2"}>
            {/* Main Menu Item - Subtle Brutalist Style */}
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-base transition-colors",
                    isActive
                        ? "font-black bg-main text-white hover:bg-main"
                        : isSubpageActive
                            ? ""
                            : "text-white hover:bg-main"
                )}
            >
                <div className={cn(
                    "flex items-center justify-center",
                    isActive ? "text-white" : "text-white/70"
                )}>
                    {icon}
                </div>
                <span className={cn(
                    "text-md font-raleway font-semibold",
                    isActive ? "font-bold" : ""
                )}>
                    {children}
                </span>
            </Link>

            {/* Subpages with Subtle Style */}
            {hasSubpages && (
                <div className="pl-12 font-nunito">
                    {subpages.map(subpage => {
                        const isSubActive = currentPath === subpage.path;

                        return (
                            <Link
                                key={subpage.path}
                                href={subpage.path}
                                className={cn(
                                    "block px-2 py-1.5 text-sm transition-colors rounded-base",
                                    isSubActive
                                        ? "font-black bg-main text-white"
                                        : "text-white/70 hover:text-white hover:bg-main"
                                )}
                            >
                                {subpage.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * Main Sidebar Component with Subtle Brutalist styling
 */
export default function Sidebar({ isBottomNavModal = false }: SidebarProps) {
    const { userData, loading } = useUser();
    const pathname = usePathname();
    const { width } = useWindowSize();
    const isMobile = isBottomNavModal || (width ? width < 768 : false);
    const hasActiveSubscription = userData?.subscription?.active;

    // If userData is not available yet, don't try to construct nav items with undefined values
    const navItems = (userData && userData.username) ? [
        {
            path: `/${userData.username}/home`, label: 'Meu Lar', icon: <IconMeuLar width={28} height={28} />,
            subpages: [
                { path: `/${userData.username}/perfil`, label: 'Perfil' },
                { path: `/${userData.username}/criancas`, label: 'Crianças' }
            ]
        },
        {
            path: `/${userData.username}/plano`, label: 'Plano Parental', icon: <IconPlan width={28} height={28} />,
            // subpages: [
            //     { path: `/${userData.username}/plano/resumo`, label: 'Resumo' },
            //     { path: `/${userData.username}/plano/formulario`, label: 'Formulário' },
            // ]
        },
        { path: `/${userData.username}/calendario`, label: 'Calendário', icon: <IconCalendar width={28} height={28} /> },
        // { path: `/${userData.username}/financas`, label: 'Finanças', icon: <IconFinance width={28} height={28} /> },
        // // { path: `/${userData.username}/handshake`, label: 'Decisões', icon: <IconHandshake width={28} height={28} /> },
        // { path: `/${userData.username}/chat`, label: 'Conversas', icon: <IconChat width={28} height={28} /> },
        // { path: `/${userData.username}/check-in`, label: 'Check-in', icon: <IconMaplocation width={28} height={28} /> },
        // { path: `/${userData.username}/settings`, label: 'Configurações', icon: <IconSettings width={28} height={28} /> },
    ] : [];

    // Choose animations based on context - disable animations completely when in BottomNav modal
    const containerVariants = isBottomNavModal ? {} : (isMobile ? mobileVariants : sidebarVariants);
    const animationVariants = isBottomNavModal ? {} : (isMobile ? mobileItemVariants : itemVariants);

    return (
        <nav className={cn(
            "flex flex-col w-full",
            isMobile ? "py-2" : "h-full"//"h-full border-r border-border/30"
        )}>
            {!isMobile && (
                <div className="py-4 px-4 mb-8 flex flex-row items-center justify-center">
                    {/* <h1 className="text-xl text-center">CompartiLar</h1> */}
                    <Link href="/">
                        <CompartilarLogo width={60} height={60} className="flex-shrink-0 text-main" />
                    </Link>
                </div>
            )}

            {/* Menu with subtle styling */}
            <motion.div
                initial={isBottomNavModal ? false : "hidden"}
                animate={isBottomNavModal ? false : "visible"}
                variants={containerVariants}
                className={cn(
                    "flex flex-col flex-1",
                    isMobile ? "p-2" : "px-3 py-1"
                )}
            >
                {loading ? (
                    <motion.div
                        variants={isBottomNavModal ? undefined : animationVariants}
                        className="flex flex-col gap-3 mx-2 my-4"
                    >
                        <Skeleton className="h-9 w-full rounded-base" />
                        <Skeleton className="h-9 w-full rounded-base" />
                        <Skeleton className="h-9 w-full rounded-base" />
                        <Skeleton className="h-9 w-full rounded-base" />
                    </motion.div>
                ) : (
                    <motion.div
                        className="flex flex-col"
                        variants={isBottomNavModal ? undefined : animationVariants}
                    >
                        {navItems.map(
                            (item) => (
                                <NavItem
                                    key={item.path}
                                    href={item.path}
                                    currentPath={pathname}
                                    icon={item.icon}
                                    subpages={item.subpages}
                                    isMobile={isMobile}
                                >
                                    {item.label}
                                </NavItem>
                            )
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* Subscription Button at the bottom of sidebar */}
            {/* {!isMobile && !loading && !hasActiveSubscription && (
                <div className="mt-auto px-4 py-4 border-t border-border/30">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white/80">Desbloqueie recursos premium</span>
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                        </div>
                        <SubscriptionButton />
                    </div>
                </div>
            )} */}
        </nav>
    );
}