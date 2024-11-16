// app/components/Sidebar.tsx
'use client';
// importing modules
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
// importing components
import NavLink from '@components/ui/NavLink';
import LoginHeader from "@components/layout/LoginHeader";
import { useUser } from '@context/userContext';

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
                    ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' 
                    : 'font-light'
            }`}
        >
            <NavLink href={href}>
                <p>{children}</p>
            </NavLink>
        </motion.div>
    );
};

export default function Sidebar() {
    const { userData, loading } = useUser();
    const pathname = usePathname();

    const navItems = userData ? [
        { path: `/${userData.username}`,           label: 'Meu Lar' },
        { path: `/${userData.username}/info`,      label: 'Informações' },
        { path: `/${userData.username}/calendar`,  label: 'Calendário' },
        { path: `/${userData.username}/finances`,  label: 'Finanças' },
        { path: `/${userData.username}/handshake`, label: 'Decisões' },
        { path: `/${userData.username}/chat`,      label: 'Conversas' },
        { path: `/${userData.username}/settings`,  label: 'Configurações' },
    ] : [];

    return (
        <div>
            <LoginHeader />
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
        );
}