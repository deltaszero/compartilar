// app/components/Sidebar.tsx
'use client';
// importing modules
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
// importing components
import NavLink from '@components/ui/NavLink';
// import LoginHeader from "@components/layout/LoginHeader";
import { useUser } from '@context/userContext';
// importing assets
import CameraIcon from '@assets/icons/camera.svg';
import premiumImage from "@assets/images/hand_house_vertical_rect_2.jpg";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TreeIcon from '@assets/icons/tree.svg';

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
const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
        x: 0, 
        opacity: 1,
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
    children: React.ReactNode;
}

const NavItem = ({ href, currentPath, children }: NavItemProps) => {
    const isActive = currentPath === href;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ x: isActive ? 0 : 10 }}
            className={`pl-2 ${
                isActive 
                    ? 'text-lg font-Raleway font-bold' 
                    : 'font-light'
            }`}
        >
            <NavLink href={href}>
                <p>{children}</p>
            </NavLink>
        </motion.div>
    );
};

const PremiumCard = () => (
<div className={`card card-compact shadow-xl mx-8 bg-white text-neutral`}>
    <Image
        src={premiumImage}
        alt="Call to Action Image: Hand holding a house"
        className='rounded-t-xl'
    />
    <div className="card-body flex flex-col gap-2">
        <p className="card-title font-Raleway text-md">
            Aprimore Sua Experiência
        </p>
        <p className="font-Raleway text-sm">
            Consiga acesso a ferramentas avançadas para uma coparentalidade mais fluida e organizada.
        </p>
        <div className="card-actions justify-end">
            <button className={`btn rounded-lg hover:border-primaryPurple bg-primaryPurple text-base-100 hover:bg-white hover:text-primaryPurple font-raleway`}>
                Ver Planos
            </button>
        </div>
    </div>
</div>
);

export default function Sidebar() {
    const { userData, loading } = useUser();
    const pathname = usePathname();

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const navItems = userData ? [
        { path: `/${userData.username}`,           label: 'Meu Lar' },
        { path: `/${userData.username}/info`,      label: 'Informações' },
        { path: `/${userData.username}/calendar`,  label: 'Calendário' },
        { path: `/${userData.username}/finances`,  label: 'Finanças' },
        { path: `/${userData.username}/handshake`, label: 'Decisões' },
        { path: `/${userData.username}/chat`,      label: 'Conversas' },
        { path: `/${userData.username}/settings`,  label: 'Configurações' },
    ] : [];

    const avatarSize = 68;

    return (
        <div className="sticky top-0 h-screen overflow-y-none flex flex-col justify-between pb-6 pt-3">
            <div className={`text-neutral-content`}>
                {/* avatar */}
                <div className='flex flex-col items-center space-y-2'>
                    <div className="avatar">
                        {loading ? (
                            <div className={`mask mask-squircle w-${avatarSize}`}>
                                <div className={`skeleton h-${avatarSize} w-${avatarSize} rounded-md`}></div>
                            </div>
                        ) : (
                            <div className={`mask mask-squircle w-${avatarSize}`}>
                                {userData && userData.photoURL ? (
                                    <Image
                                        src={userData.photoURL}
                                        width={avatarSize}
                                        height={avatarSize}
                                        alt="Avatar"
                                        priority
                                    />
                                ) : (
                                    <CameraIcon width={avatarSize} height={avatarSize} />
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        {loading ? (
                            <div className="flex flex-col gap-4">
                                <div className="skeleton h-4 w-72 rounded-md"></div>
                            </div>
                        ) : (
                            <div>
                                {userData && userData.lastName && userData.firstName ? (
                                    <div className="text-base-300">
                                        {capitalizeFirstLetter(userData.firstName)} {capitalizeFirstLetter(userData.lastName)}
                                    </div>
                                ) : (
                                    <p>User not found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* menu */}
                <motion.nav
                    initial="hidden"
                    animate="visible"
                    variants={sidebarVariants}
                    className="flex flex-col gap-16"
                > 
                    {loading ? (
                        <motion.div variants={itemVariants} className="flex flex-col gap-4 mx-6 my-6">
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                        </motion.div>
                    ) : (
                        <motion.div className="flex flex-col gap-4 my-6" variants={itemVariants}>
                            {navItems.map(
                                (item) => (
                                    <NavItem 
                                        key={item.path}
                                        href={item.path}
                                        currentPath={pathname}
                                    >
                                        {item.label}
                                    </NavItem>
                                )
                            )}
                        </motion.div>
                    )}
                </motion.nav>
            </div>
            <div>
                <PremiumCard />
            </div>
        </div>
        );
}