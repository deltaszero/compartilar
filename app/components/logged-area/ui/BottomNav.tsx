import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '@/app/components/logged-area/ui/Sidebar';
// import { useWindowSize } from '@/app/hooks/useWindowSize';

import { usePathname } from 'next/navigation';
import { useUser } from '@context/userContext';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// importing assets
import IconUser from '@assets/icons/bottom_bar_user.svg';
import IconMaplocation from '@assets/icons/bottom_bar_maplocation.svg';
import IconHouse from '@assets/icons/bottom_bar_house.svg';
import IconMore from '@assets/icons/bottom_bar_more.svg';
import IconChat from '@assets/icons/bottom_bar_chat.svg';

const BottomNav = () => {
    const { userData, loading } = useUser();
    const pathname = usePathname();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const { width } = useWindowSize();
    // const isMobile = width ? width < 768 : true;
    
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
            <div className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background flex items-center justify-around">
                <div className="flex items-center justify-center gap-8 w-full px-4">
                    {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-12 w-12" />
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
            path: `/${userData.username}/perfil`,
            label: 'Perfil',
            icon: <IconUser width={24} height={24} />
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
            <footer className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background z-[9998] shadow-lg flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    
                    // Special case for "Mais" item
                    if (item.label === 'Mais') {
                        return (
                            <Button
                                key={item.path}
                                variant="ghost"
                                className="h-full flex flex-col items-center justify-center rounded-none w-full max-w-[72px]"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <motion.div 
                                    className="flex flex-col items-center"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-xs font-medium mt-0.5",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            </Button>
                        );
                    }
                    
                    // Regular navigation items
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "h-full flex flex-col items-center justify-center rounded-none w-full max-w-[72px]",
                                "hover:bg-accent/50 transition-colors",
                                isActive ? "border-t-2 border-primary" : ""
                            )}
                        >
                            <motion.div 
                                className="flex flex-col items-center"
                                whileTap={{ scale: 0.9 }}
                            >
                                <div className={cn(
                                    "flex items-center justify-center",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {item.icon}
                                </div>
                                <span className={cn(
                                    "text-[10px] sm:text-xs font-medium mt-0.5",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </footer>

            {/* Simplified AnimatePresence structure */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            className="fixed inset-0 z-[9999] bg-black/50 touch-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                        />
                        
                        {/* Content Panel */}
                        <motion.div
                            key="panel"
                            style={{ 
                                translateX: 0,  // Explicitly prevent X translation
                                x: 0,           // Reset any X movement
                                position: 'fixed',
                                bottom: 0, 
                                left: 0, 
                                right: 0,
                                zIndex: 10000
                            }}
                            className="bg-black rounded-t-xl p-4 max-h-[85vh] overflow-y-auto"
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
                            {/* Drag handle */}
                            <div className="w-16 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-6"></div>
                            
                            {/* Modal content with transform-none to prevent conflicts */}
                            <div className="pb-20">
                                <div className="transform-none !translate-x-0">
                                    <Sidebar isBottomNavModal={true} />
                                </div>
                                
                                <Button
                                    variant="outline"
                                    className="w-full mt-8"
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