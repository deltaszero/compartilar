// app/components/Sidebar.tsx
'use client';

import NavLink from '@components/ui/NavLink';
import LoginHeader from "@components/layout/LoginHeader";
import { useUser } from '@context/userContext';

import { usePathname } from 'next/navigation';

export default function Sidebar() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, userData, loading } = useUser();
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-16 bg-neutral">
            <LoginHeader />
            {userData ? (
                <div className="flex flex-col gap-4 my-6">
                    <div className={`pl-2 ${pathname === `/${userData.username}` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/`}>
                            <p>
                                Meu Lar
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/info` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/info`}>
                            <p>
                                Informações
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/calendar` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/calendar`}>
                            <p>
                                Calendário
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/finances` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/finances`}>
                            <p>
                                Finanças
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/handshake` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/handshake`}>
                            <p>
                                Decisões
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/chat` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
                        <NavLink href={`/${userData.username}/chat`}>
                            <p>
                                Conversas
                            </p>
                        </NavLink>
                    </div>
                    <div className={`pl-2 ${pathname === `/${userData.username}/settings` ? 'border-l-2 border-secondaryPurple text-secondaryPurple text-lg font-Raleway font-bold' : 'font-light'}`}>
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
