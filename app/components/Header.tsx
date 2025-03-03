'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogIn } from 'lucide-react';

/**
 * navItems is an array of objects containing the label and href of each navigation item.
 */
const navItems = [
    { label: 'Descomplique',   href: '#descomplique' },
    { label: 'Organize',       href: '#organize' },
    { label: 'Proteja',        href: '#proteja' },
    { label: 'Despreocupe-se', href: '#despreocupe-se' }
];

/**
 * MobileNav is a component that renders the mobile navigation menu.
 */
const MobileNav = () => (
  <div className="lg:hidden relative">
    <button className="flex flex-row items-center gap-2 px-2 py-1">
      <Menu className="h-5 w-5" />
      <h1 className="text-2xl font-bold uppercase">CompartiLar</h1>
    </button>
  </div>
);

/**
 * DesktopNav is a component that renders the desktop navigation menu.
 */
const DesktopNav = () => (
  <nav className="hidden lg:flex space-x-4">
    {navItems.map((item) => (
      <Link 
        key={item.label} 
        href={item.href}
        className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        {item.label}
      </Link>
    ))}
  </nav>
);

/**
 * LoginButton is a component that renders the login button.
 */
const LoginButton = () => (
  <Link 
    href="/login" 
    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md font-bold"
  >
    <span>Entrar</span>
    <LogIn className="h-4 w-4" />
  </Link>
);

/**
 * Header is a component that renders the website header.
 */
const Header = () => {
    const router = useRouter();

    return (
        <header className="flex items-center justify-between bg-muted py-4 px-2 sm:px-6">
            <div className="flex items-center">
                <MobileNav />
                <div className="hidden lg:block">
                    <h1 className="text-2xl font-bold uppercase">CompartiLar</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DesktopNav />
                <div className="mx-2"></div>
                <LoginButton />
            </div>
        </header>
    );
};

export default Header;