import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '@/app/components/logged-area/ui/Sidebar';

import { usePathname } from 'next/navigation';
import { useUser } from '@context/userContext';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// importing assets
import IconCalendar from '@assets/icons/bottom_bar_calendar_v2.svg';
import IconMaplocation from '@assets/icons/bottom_bar_geolocation_v2.svg';
import IconHouse from '@assets/icons/bottom_bar_house.svg';
import IconMore from '@assets/icons/bottom_bar_more_v2.svg';
import IconChat from '@assets/icons/bottom_bar_chat.svg';

/**
 * NavItem component for bottom navigation in brutalist style
 */
const NavItem = ({ 
    path, 
    label, 
    icon, 
    isActive, 
    onClick 
}: { 
    path: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick?: () => void;
}) => {
    // For the "Mais" item that opens modal
    if (label === 'Mais') {
        return (
            <div
                key={path}
                className={cn(
                    "h-full flex flex-col items-center justify-center w-full cursor-pointer",
                    "border-0 border-t-2",
                    isActive 
                        ? "border-border bg-main shadow-shadow" 
                        : "border-transparent bg-bg hover:bg-main/20"
                )}
                onClick={onClick}
            >
                <motion.div 
                    className="flex flex-col items-center"
                    whileTap={{ scale: 0.9 }}
                >
                    <div className="flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[12px] mt-1 font-raleway font-bold">
                        {label}
                    </span>
                </motion.div>
            </div>
        );
    }
    
    // Regular navigation items
    return (
        <Link
            href={path}
            className={cn(
                "h-full flex flex-col items-center justify-center w-full",
                "border-0 border-t-2 transition-colors",
                isActive 
                    ? "border-border bg-main shadow-shadow" 
                    : "border-transparent bg-bg hover:bg-main/20"
            )}
        >
            <motion.div 
                className="flex flex-col items-center"
                whileTap={{ scale: 0.9 }}
            >
                <div className="flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[12px] mt-1 font-raleway font-bold">
                    {label}
                </span>
            </motion.div>
        </Link>
    );
};

const BottomNav = () => {
    const { userData, loading } = useUser();
    const pathname = usePathname();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Close when user navigates
    useEffect(() => {
        setIsModalOpen(false);
    }, [pathname]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Close if the user has dragged down by more than 50px
        if (info.offset.y > 50) {
            setIsModalOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-16 border-t-2 border-border bg-bg flex items-center justify-around">
                <div className="flex items-center justify-between w-full">
                    {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-14 w-full border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    if (!userData) return null;

    const navItems = [
        {
            path: `/${userData.username}/home`,
            label: 'Meu Lar',
            icon: <IconHouse width={24} height={24} />
        },
        {
            path: `/${userData.username}/calendario`,
            label: 'Calendário',
            icon: <IconCalendar width={24} height={24} />
        },
        {
            path: `/${userData.username}/check-in`,
            label: 'Check-in',
            icon: <IconMaplocation width={24} height={24} />
        },
        {
            path: `/${userData.username}/chat`,
            label: 'Chat',
            icon: <IconChat width={24} height={24} />
        },
        {
            path: 'more',
            label: 'Mais',
            icon: <IconMore width={24} height={24} />
        },
    ];

    return (
        <>
            {/* Brutalist Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 h-16 border-t-2 border-border bg-bg z-[9999] flex items-stretch justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <NavItem
                            key={item.path}
                            path={item.path}
                            label={item.label}
                            icon={item.icon}
                            isActive={isActive}
                            onClick={item.label === 'Mais' ? () => setIsModalOpen(true) : undefined}
                        />
                    );
                })}
            </footer>

            {/* Modal with Brutalist Styling */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            className="fixed inset-0 z-[9999] bg-overlay touch-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                        />
                        
                        {/* Content Panel - Brutalist Style */}
                        <motion.div
                            key="panel"
                            style={{ 
                                translateX: 0,
                                x: 0,
                                position: 'fixed',
                                bottom: 0, 
                                left: 0, 
                                right: 0,
                                zIndex: 10000
                            }}
                            className="bg-blank border-2 border-border shadow-shadow rounded-t-base p-4 max-h-[85vh] overflow-y-auto"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ 
                                type: 'spring', 
                                damping: 25,
                                stiffness: 250 
                            }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0}
                            dragTransition={{ 
                                bounceDamping: 20
                            }}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Brutalist Drag Handle */}
                            <div className="w-16 h-2 bg-main rounded-base mx-auto mb-6"></div>
                            
                            {/* Modal content */}
                            <div className="pb-20">
                                <div className="transform-none !translate-x-0">
                                    <Sidebar isBottomNavModal={true} />
                                </div>
                                
                                {/* Brutalist Close Button */}
                                <Button
                                    variant={"default"}
                                    className="w-full mt-8 font-heading"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default BottomNav;