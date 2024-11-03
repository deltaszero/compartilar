// components/Sidebar.tsx
'use client';

import NavLink from '@components/ui/NavLink';
import LoginHeader from "@components/layout/LoginHeader";
import { useUser } from '@context/userContext';

import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const { user, userData, loading } = useUser();
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-16 bg-neutral">
            <LoginHeader />
            {userData ? (
                <div className="flex flex-col gap-4 my-6">
                    <div className={`pl-2 ${pathname === `/${userData.username}` ? 'border-l-4 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/`}>
                            <p>
                                Meu Lar
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/settings` ? 'border-l-4 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/settings`}>
                            <p>
                                Configurações
                            </p>
                        </NavLink>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mx-6 my-6">
                    <div className="skeleton h-8 w-full rounded-md"></div>
                    <div className="skeleton h-8 w-full rounded-md"></div>
                </div>
            )}
        </nav>
    );
}
