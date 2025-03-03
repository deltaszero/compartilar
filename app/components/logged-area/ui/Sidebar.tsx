// app/components/Sidebar.tsx
'use client';
// importing modules
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
// importing components
import { useUser } from '@context/userContext';
import LoginHeader from "@/app/components/LoginHeader";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWindowSize } from '@/app/hooks/useWindowSize';

// importing assets
import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
import IconPlan from '@assets/icons/icon_meu_lar_plan.svg';
import IconCalendar from '@assets/icons/icon_meu_lar_calendar.svg';
import IconFinance from '@assets/icons/icon_meu_lar_finance.svg';
import IconHandshake from '@assets/icons/icon_meu_lar_handshake.svg';
import IconChat from '@assets/icons/icon_meu_lar_chat.svg';
import IconSettings from '@assets/icons/icon_meu_lar_settings.svg';

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

const NavItem = ({ href, currentPath, icon, children, subpages, isMobile = false }: NavItemProps) => {
    const isActive = currentPath === href;
    const hasSubpages = subpages && subpages.length > 0;
    
    return (
        <div className={isMobile ? "mb-3" : "mt-6 mx-4"}>
            {/* Main Menu Item */}
            <Link 
                href={href}
                className={cn(
                    "flex items-center gap-4 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                        ? "bg-primary-foreground/10 text-white font-medium" 
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"
                )}
            >
                <div className={cn(
                    isActive ? "text-white" : "text-primary-foreground/70"
                )}>
                    {icon}
                </div>
                <span className={cn(
                    isMobile ? "text-base" : "text-md",
                    isActive ? "font-medium" : ""
                )}>
                    {children}
                </span>
            </Link>

            {/* Subpages (always visible if they exist) */}
            {hasSubpages && (
                <div className={cn(
                    "mt-1 space-y-1",
                    isMobile ? "ml-8" : "ml-10" 
                )}>
                    {subpages.map(subpage => (
                        <Link 
                            key={subpage.path} 
                            href={subpage.path}
                            className={cn(
                                "block px-3 py-1 rounded-md transition-colors",
                                isMobile ? "text-sm" : "text-sm",
                                currentPath === subpage.path 
                                    ? "text-white bg-primary-foreground/10 font-medium" 
                                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5"
                            )}
                        >
                            {subpage.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({ isBottomNavModal = false }: SidebarProps) {
    const { userData, loading } = useUser();
    const pathname = usePathname();
    const { width } = useWindowSize();
    const isMobile = isBottomNavModal || (width ? width < 768 : false);

    // If userData is not available yet, don't try to construct nav items with undefined values
    const navItems = (userData && userData.username) ? [
        {
            path: `/${userData.username}/home`, label: 'Compartilar', icon: <IconMeuLar width={24} height={24} />,
            subpages: [
                { path: `/${userData.username}/perfil`, label: 'Perfil' },
                { path: `/${userData.username}/rede`, label: 'Rede de Apoio' }
            ]
        },
        {
            path: `/${userData.username}/plan`, label: 'Plano Parental', icon: <IconPlan width={24} height={24} />,
            subpages: [
                { path: `/${userData.username}/plan/resumo`, label: 'Resumo'},
                { path: `/${userData.username}/plan/form`, label: 'Formulário' },
            ]
        },
        { path: `/${userData.username}/calendario`, label: 'Calendário', icon: <IconCalendar width={24} height={24} /> },
        { path: `/${userData.username}/financas`, label: 'Finanças', icon: <IconFinance width={24} height={24} /> },
        { path: `/${userData.username}/handshake`, label: 'Decisões', icon: <IconHandshake width={24} height={24} /> },
        { path: `/${userData.username}/chat`, label: 'Conversas', icon: <IconChat width={24} height={24} /> },
        { path: `/${userData.username}/settings`, label: 'Configurações', icon: <IconSettings width={24} height={24} /> },
    ] : [];

    // Choose animations based on context - disable animations completely when in BottomNav modal
    const containerVariants = isBottomNavModal ? {} : (isMobile ? mobileVariants : sidebarVariants);
    const animationVariants = isBottomNavModal ? {} : (isMobile ? mobileItemVariants : itemVariants);

    return (
        <nav className={cn(
            "flex flex-col w-full",
            isMobile ? "py-2" : "h-full"
        )}>
            <div className={cn(
                isMobile ? "px-4" : "pt-6 px-4"
            )}>
                {!isMobile && (
                    <div className="hidden xl:flex flex-row justify-center items-center space-x-2 mb-8">
                        <LoginHeader />
                    </div>
                )}
                
                {/* menu - disable animations when in BottomNav modal */}
                <motion.nav
                    initial={isBottomNavModal ? false : "hidden"}
                    animate={isBottomNavModal ? false : "visible"}
                    variants={containerVariants}
                    className="flex flex-col gap-1"
                >
                    {loading ? (
                        <motion.div 
                            variants={isBottomNavModal ? undefined : animationVariants} 
                            className="flex flex-col gap-4 mx-6 my-6"
                        >
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </motion.div>
                    ) : (
                        <motion.div 
                            className={cn(
                                "flex flex-col",
                                isMobile ? "gap-1 px-2" : ""
                            )} 
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
                </motion.nav>
            </div>
        </nav>
    );
}