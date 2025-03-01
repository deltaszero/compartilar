// app/components/Sidebar.tsx
'use client';
// importing modules
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
// import Image from 'next/image';
// importing components
import NavLink from '@/app/components/utils/NavLink';
// import LoginHeader from "@components/layout/LoginHeader";
import { useUser } from '@context/userContext';
// importing assets
// import premiumImage from "@assets/images/hand_house_vertical_rect_2.jpg";
import LoginHeader from "@/app/components/LoginHeader";
import IconMeuLar from '@assets/icons/icon_meu_lar.svg';
// import IconInfo from '@assets/icons/icon_meu_lar_info.svg';
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
    subpages?: Array<{
        path: string;
        label: string;
    }>;
}

const NavItem = ({ href, currentPath, icon, children, subpages }: NavItemProps) => {
    const isActive = currentPath === href;
    const hasSubpages = subpages && subpages.length > 0;

    return (
        <div className="mt-6 mx-2">
            {/* Main Menu Item */}
            <div className="flex flex-row items-center gap-4">
                <div className={`${isActive ? 'text-purpleShade03' : ''}`}>
                    {icon}
                </div>
                <NavLink href={href}>
                    <p className={`text-md hover:text-purpleShade03 ${isActive ? 'text-purpleShade03 font-bold text-lg' : ''}`}>
                        {children}
                    </p>
                </NavLink>
            </div>

            {/* Subpages (always visible if they exist) */}
            {hasSubpages && (
                <div className="ml-10 mt-1">
                    {subpages.map(subpage => (
                        <NavLink key={subpage.path} href={subpage.path}>
                            <p className={`pb-1 text-sm font-raleway hover:text-purpleShade03 ${currentPath === subpage.path ? 'text-purpleShade03 text-lg' : ''}`}>
                                {subpage.label}
                            </p>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
};


// const PremiumCard = () => (
//     <div className={`card card-compact shadow-xl mx-8 bg-white text-neutral`}>
//         <Image
//             src={premiumImage}
//             alt="Call to Action Image: Hand holding a house"
//             className='rounded-t-xl'
//         />
//         <div className="card-body flex flex-col gap-2">
//             <p className="card-title font-Raleway text-md">
//                 Aprimore Sua Experiência
//             </p>
//             <p className="font-Raleway text-sm">
//                 Consiga acesso a ferramentas avançadas para uma coparentalidade mais fluida e organizada.
//             </p>
//             <div className="card-actions justify-end">
//                 <button className={`btn rounded-lg hover:border-primary bg-primary text-base-100 hover:bg-white hover:text-primary font-raleway`}>
//                     Ver Planos
//                 </button>
//             </div>
//         </div>
//     </div>
// );

export default function Sidebar() {
    const { userData, loading } = useUser();
    const pathname = usePathname();

    const navItems = userData ? [
        {
            path: `/${userData.username}/home`, label: 'Compartilar', icon: <IconMeuLar width={24} height={24} />,
            subpages: [
                // { path: `/${userData.username}/home`, label: 'Meu Lar' },
                { path: `/${userData.username}`, label: 'Perfil' },
                { path: `/${userData.username}/familia`, label: 'Família' },
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


    return (
        // <div className="flex flex-col justify-between sticky top-0 overflow-y-none pt-3">
        <nav className="
                flex flex-col justify-between
                xl:h-screen overflow-y-none 
            ">
            <div className="pt-4">
                <div className="hidden xl:flex flex-row justify-center items-center space-x-2">
                    <LoginHeader />
                </div>
                {/* menu */}
                <motion.nav
                    initial="hidden"
                    animate="visible"
                    variants={sidebarVariants}
                    className="flex flex-col gap-2 xl:my-4"
                >
                    {loading ? (
                        <motion.div variants={itemVariants} className="flex flex-col gap-4 mx-6 my-6">
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                            <div className="skeleton h-8 w-full rounded-md"></div>
                        </motion.div>
                    ) : (
                        <motion.div className="flex flex-col" variants={itemVariants}>
                            {navItems.map(
                                (item) => (
                                    <NavItem
                                        key={item.path}
                                        href={item.path}
                                        currentPath={pathname}
                                        icon={item.icon}
                                        subpages={item.subpages}
                                    >
                                        {item.label}
                                    </NavItem>
                                )
                            )}
                        </motion.div>
                    )}
                </motion.nav>
            </div>
            {/* <div className="divider mx-6"></div>
            <div>
                <PremiumCard />
            </div> */}
        </nav>
    );
}