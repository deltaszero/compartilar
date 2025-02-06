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
import premiumImage from "@assets/images/hand_house_vertical_rect_2.jpg";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TreeIcon from '@assets/icons/tree.svg';
import LoginHeader from "@components/layout/LoginHeader";
import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
import IconInfo from '@assets/icons/icon_meu_lar_info.svg';
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
    icon: React.ReactNode;
    children: React.ReactNode;
}

const NavItem = ({ href, currentPath, icon, children }: NavItemProps) => {
    const isActive = currentPath === href;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ x: isActive ? 0 : 10 }}
            className={`pl-2 flex flex-row gap-4 ${
                isActive 
                    ? 'text-xl font-bold text-primary'
                    : 'font-light text-lg'
            }`}
        >
            <div>
                {icon}
            </div>
            <div className="flex flex-col justify-center">
                <NavLink href={href}>
                    <p>{children}</p>
                </NavLink>
            </div>
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
            <button className={`btn rounded-lg hover:border-primary bg-primary text-base-100 hover:bg-white hover:text-primary font-raleway`}>
                Ver Planos
            </button>
        </div>
    </div>
</div>
);

export default function Sidebar() {
    const { userData, loading } = useUser();
    const pathname = usePathname();

    const navItems = userData ? [
        { path: `/${userData.username}`,           label: 'Meu Lar',         icon: <IconMeuLar width={32} height={32} /> },
        { path: `/${userData.username}/info`,      label: 'Informações',     icon: <IconInfo width={32} height={32} /> },
        { path: `/${userData.username}/plan`,      label: 'Plano de Parentalidade', icon: <IconPlan width={32} height={32} /> },
        { path: `/${userData.username}/calendar`,  label: 'Calendário',      icon: <IconCalendar width={32} height={32} /> },
        { path: `/${userData.username}/finances`,  label: 'Finanças',       icon: <IconFinance width={32} height={32} /> },
        { path: `/${userData.username}/handshake`, label: 'Decisões',      icon: <IconHandshake width={32} height={32} /> },
        { path: `/${userData.username}/chat`,      label: 'Conversas',      icon: <IconChat width={32} height={32} /> },
        { path: `/${userData.username}/settings`,  label: 'Configurações', icon: <IconSettings width={32} height={32} /> },
    ] : [];

    

    return (
        <div className="sticky top-0 h-screen overflow-y-none flex flex-col justify-between pb-6 pt-3">
            <div className={`text-neutral-content`}>
                    <LoginHeader />
                <div className="divider mx-6"></div>
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
                                        icon={item.icon}
                                    >
                                        {item.label}
                                    </NavItem>
                                )
                            )}
                        </motion.div>
                    )}
                </motion.nav>
            </div>
            <div className="divider mx-6"></div>
            <div>
                <PremiumCard />
            </div>
        </div>
        );
}