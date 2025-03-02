import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Sidebar from '@/app/components/logged-area/ui/Sidebar';
import { useWindowSize } from '@/app/hooks/useWindowSize';

import { usePathname } from 'next/navigation';
import NavLink from '@/app/components/utils/NavLink';
import { useUser } from '@context/userContext';
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
    const { width } = useWindowSize();
    const isMobile = width ? width < 768 : false;
    
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
            <div className="btm-nav bg-neutral animate-pulse">
                <div className="flex flex-row items-center justify-center gap-2">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="skeleton h-12 w-12"></div>
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
            path: 'mais',
            label: 'Mais',
            icon: <IconMore width={24} height={24} onClick={() => setIsModalOpen(true)} />
        },
    ];

    return (
        <>
            <footer className="btm-nav btm-nav-sm bg-base-100 z-[9998] shadow-lg">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            className={`block ${isActive ? 'active text-purpleShade04' : ''}`}
                            onClick={item.label === 'Mais' ? () => setIsModalOpen(true) : undefined}
                        >
                            {item.label === 'Mais' ? (
                                // Render without NavLink for "Mais"
                                <motion.div 
                                    className={`flex flex-col items-center justify-center py-1 ${isActive ? '' : 'text-neutral'}`}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className="flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <p className="text-[10px] sm:text-xs font-nunito font-bold mt-0.5">
                                        {item.label}
                                    </p>
                                </motion.div>
                            ) : (
                                // Render with NavLink for other items
                                <NavLink href={item.path}>
                                    <motion.div 
                                        className={`flex flex-col items-center justify-center py-1 ${isActive ? '' : 'text-neutral'}`}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <div className="flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-nunito font-bold mt-0.5">
                                            {item.label}
                                        </p>
                                    </motion.div>
                                </NavLink>
                            )}
                        </button>
                    );
                })}
            </footer>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-[9999] bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-base-300 rounded-t-xl p-4 max-h-[80vh] overflow-y-auto safe-area-bottom"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ 
                                type: 'spring', 
                                damping: isMobile ? 40 : 25, 
                                stiffness: isMobile ? 400 : 300,
                                mass: 0.8 
                            }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.5}
                            dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag handle - made more visible */}
                            <div className="w-20 h-1.5 bg-neutral/50 rounded-full mx-auto mb-6"></div>
                            
                            {/* Modal content with improved spacing */}
                            <div className="pb-safe pb-4">
                                <Sidebar />
                                
                                <button
                                    className="btn btn-outline btn-neutral w-full mt-8 rounded-xl"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BottomNav;