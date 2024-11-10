// app/components/layout/Header.tsx
'use client';
// importing modules
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
// importing components
import NavLink from '@components/ui/NavLink';
import { auth } from '@lib/firebaseConfig';
import { useUser } from '@context/userContext';
// importing assets
import HamburgerIcon from '@assets/icons/hamburger.svg';
import TreeIcon from '@assets/icons/tree.svg';
import CameraIcon from '@assets/icons/camera.svg';
import LoginIcon from '@assets/icons/login.svg';

const Header = () => {
    // setting up hooks
    const { user, userData, loading } = useUser();
    const router = useRouter();
    // setting up functions
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    // rendering
    return (
        <header className="navbar bg-neutral text-neutral-content lg:fixed lg:top-0 lg:left-0 lg:right-0 px-6 z-30">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden"> {/* lg:hidden */}
                        <HamburgerIcon width={44} height={44} />
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-md z-[1] mt-3 w-52 p-2 shadow">
                        <li><a>Organize</a></li>
                        <li><a>Descomplique</a></li>
                        <li><a>Proteja</a></li>
                        <li><a>Despreocupe-se</a></li>
                    </ul>
                </div>
                <div className="hidden lg:flex"> {/* hidden lg:flex */}
                    <div className="flex items-center justify-center space-x-2">
                        {/* tree icon */}
                        <TreeIcon width={44} height={44} />
                        <a href="/" className="btn btn-ghost text-xl rounded-md p-0">
                            <p className="text-2xl font-cinzel">
                                CompartiLar
                            </p>
                        </a>
                    </div>
                </div>
            </div>
            <div className="navbar-center hidden lg:flex"> {/* hidden lg:flex */}
                <ul className="menu menu-horizontal px-1 [&_li>*]:rounded-md">
                    <li ><NavLink href="/">Organize</NavLink></li>
                    <li><NavLink href="/">Descomplique</NavLink></li>
                    <li><NavLink href="/">Proteja</NavLink></li>
                    <li><NavLink href="/">Despreocupe-se</NavLink></li>
                </ul>
            </div>
            {loading ? (
                <div className="navbar-end">
                    <div className="skeleton h-8 w-1/2 rounded-md"></div>
                </div>
            ) : (
                <div className="navbar-end">
                    {user && userData ? (
                        <div className="flex items-center space-x-2 z-50">
                            <NavLink href={`/${userData.username}`}>
                                <span className="font-medium text-lg">
                                    {userData.username}
                                </span>
                            </NavLink>
                            <div className="dropdown dropdown-end">
                                <label tabIndex={0}>
                                    <div className="avatar ring-1 ring-offset-1 rounded-full hover:ring-offset-info hover:ring-info hover:cursor-pointer">
                                        {userData.photoURL ? (
                                            <Image 
                                                src={userData.photoURL}
                                                width={32}
                                                height={32}
                                                alt="Avatar"
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <CameraIcon width={32} height={32} />
                                        )}
                                    </div>
                                </label>
                                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-md w-52">
                                    <li>
                                        <NavLink href={`/${userData.username}/settings`}>Configurações</NavLink>
                                    </li>
                                    <li>
                                        <button onClick={handleSignOut}>Sair</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <a href="/login" className="btn btn-outline rounded-none flex items-center justify-center space-x-2 bg-secondaryPurple text-black hover:bg-info hover:border-none" >
                            <p className="font-normal">
                                Entrar
                            </p>
                            {/* login icon */}
                            <LoginIcon width={16} height={16} />
                        </a>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;