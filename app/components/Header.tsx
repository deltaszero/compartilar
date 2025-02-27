'use client';
// react
import React from 'react';
// next
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// firebase
import { signOut } from 'firebase/auth';
// custom
import NavLink from '@/app/components/utils/NavLink';
import { auth } from '@lib/firebaseConfig';
import { useUser } from '@context/userContext';
// assets
import HomeIcon from '@assets/icons/hive-home.svg';
import CameraIcon from '@assets/icons/camera.svg';
import LoginIcon from '@assets/icons/login.svg';

/**
 * navItems is an array of objects containing the label and href of each navigation item.
 */
const navItems = [
    { label: 'Organize',       href: '#organize' },
    { label: 'Descomplique',   href: '#descomplique' },
    { label: 'Proteja',        href: '#proteja' },
    { label: 'Despreocupe-se', href: '#despreocupe-se' }
];

/**
 * Logo is a component that renders the CompartiLar logo.
 */
const Logo = () => (
    <div className="flex items-center gap-2">
        <HomeIcon width={32} height={32} />
        <a href="/" className="text-xl rounded-md p-0">
            <h1 className="text-3xl font-nunito font-bold uppercase">
                CompartiLar
            </h1>
        </a>
    </div>
);

/**
 * MobileNav is a component that renders the mobile navigation menu.
 */
const MobileNav = () => (
    <div className="dropdown lg:hidden">
        <div tabIndex={0} role="button" className="btn btn-ghost">
            <div className="flex flex-row items-center gap-2">
                {/* <HomeIcon width={32} height={32} /> */}
                <h1 className="text-2xl font-nunito font-black uppercase">CompartiLar</h1>
            </div>
        </div>
        <ul className="menu menu-sm dropdown-content rounded-md z-[1] mt-3 w-52 p-2 shadow bg-base-100">
            {navItems.map((item) => (
                <li key={item.label}>
                    <NavLink href={item.href}>{item.label}</NavLink>
                </li>
            ))}
        </ul>
    </div>
);

/**
 * DesktopNav is a component that renders the desktop navigation menu.
 */
const DesktopNav = () => (
    <ul className="menu menu-horizontal px-1 [&_li>*]:rounded-md">
        {navItems.map((item) => (
            <li key={item.label}>
                <NavLink href={item.href}>{item.label}</NavLink>
            </li>
        ))}
    </ul>
);

/**
 * UserMenu is a component that renders the user menu.
 */
const UserMenu = ({ userData, onSignOut }: {
    userData: { username: string; photoURL?: string },
    onSignOut: () => void
}) => (
    <div className="flex items-center gap-2 z-50">
        {/* username */}
        <NavLink href={`/${userData.username}/home`}>
            <span className="hidden sm:block text-lg">{userData.username}</span>
        </NavLink>
        <div className="dropdown dropdown-end">
            <label tabIndex={0} className="hover:cursor-pointer">
                {/* profile photo */}
                <div className="avatar">
                    {userData.photoURL ? (
                        <div className="mask mask-squircle">
                            <Image
                                src={userData.photoURL}
                                width={34}
                                height={34}
                                alt="Avatar"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <CameraIcon width={34} height={34} />
                    )}
                </div>
            </label>
            {/* menul */}
            <ul className="menu menu-sm dropdown-content mt-3 p-2 shadow rounded-md w-52 bg-base-100 text-neutral">
                <li><NavLink href={`/${userData.username}/home`}>Perfil</NavLink></li>
                <li><NavLink href={`/${userData.username}/settings`}>Configurações</NavLink></li>
                <li><button onClick={onSignOut}>Sair</button></li>
            </ul>
        </div>
    </div>
);

/**
 * LoginButton is a component that renders the login button.
 */
const LoginButton = () => (
    <a
        href="/login"
        className="btn btn-neutral rounded-md font-nunito font-bold gap-2"
    >
        <span>Entrar</span>
        <LoginIcon width={16} height={16} />
    </a>
);

/**
 * Header is a component that renders the website header.
 */
const Header = () => {
    const { user, userData, loading } = useUser();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <header className="navbar bg-base-200 text-purpleShade03 lg:fixed lg:inset-x-0 lg:top-0 sm:px-6 z-[9999]">
            <div className="navbar-start">
                <MobileNav />
                <div className="hidden lg:block">
                    <Logo />
                </div>
            </div>

            <div className="navbar-end">
                <DesktopNav />
                {loading ? (
                    <div className="skeleton h-8 w-32 rounded-md" />
                ) : user && userData ? (
                    <UserMenu userData={userData} onSignOut={handleSignOut} />
                ) : (
                    <LoginButton />
                )}
            </div>
        </header>
    );
};

export default Header;