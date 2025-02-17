import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@components/Sidebar';

import { usePathname } from 'next/navigation';
import NavLink from '@components/ui/NavLink';
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

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number } }) => {
        if (info.offset.y > 100) {
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
            path: `/${userData.username}`,
            label: 'Perfil',
            icon: <IconUser width={32} height={32} />
        },
        {
            path: `/${userData.username}/meu-lar`,
            label: 'Meu Lar',
            icon: <IconHouse width={32} height={32} />
        },
        {
            path: `/${userData.username}/geolocation`,
            label: 'Localização',
            icon: <IconMaplocation width={32} height={32} />
        },
        {
            path: `/${userData.username}/chat`,
            label: 'Chat',
            icon: <IconChat width={32} height={32} />
        },
        {
            path: 'mais',
            label: 'Mais',
            icon: <IconMore width={32} height={32} onClick={() => setIsModalOpen(true)} />
        },
    ];

    return (
        <>
            <footer className="btm-nav btm-nav-sm text-primary bg-base-100 z-[9999]">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            className={`block ${isActive ? 'active' : ''}`}
                            onClick={item.label === 'Mais' ? () => setIsModalOpen(true) : undefined}
                        >
                            {item.label === 'Mais' ? (
                                // Render without NavLink for "Mais"
                                <div className="flex flex-col items-center justify-center">
                                    {item.icon}
                                </div>
                            ) : (
                                // Render with NavLink for other items
                                <NavLink href={item.path}>
                                    <div className="flex flex-col items-center justify-center">
                                        {item.icon}
                                    </div>
                                </NavLink>
                            )}
                        </button>
                    );
                })}
            </footer>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-neutral rounded-t-xl p-4 max-h-[90vh] overflow-y-auto"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.7}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag handle */}
                            <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

                            <Sidebar />

                            <button
                                className="btn  w-full mt-4"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Fechar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BottomNav;