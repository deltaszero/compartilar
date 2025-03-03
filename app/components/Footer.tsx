'use client';

import React from 'react';
import Link from 'next/link';
import { Youtube, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/lib/utils';
// assets
import DSZeroLogo from '@/app/assets/icons/landing_dszero-logo-02.svg';

const socialLinks = [
    {
        Icon: Instagram,
        label: '@compartilar',
        href: 'https://instagram.com/@compartilar'
    },
    {
        Icon: Youtube,
        label: '@compartilar',
        href: 'https://youtube.com/@compartilar'
    },
];

interface SocialLinkProps {
    Icon: React.ElementType;
    label: string;
    href: string;
}

const SocialLink = ({ Icon, label, href }: SocialLinkProps) => (
    <Button 
        variant={null} 
        size="sm"
        className="h-auto p-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        asChild
    >
        <Link
            href={href}
            className="flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
        >
            <Icon className="w-6 h-6" />
            <span className="md:hidden lg:inline">{label}</span>
        </Link>
    </Button>
);

const Footer = () => (
    <footer className={cn(
        "px-6 py-8 bg-main text-primary-foreground",
        "border-t"
    )}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-col md:flex-row items-center md:items-start md:gap-4">
                {socialLinks.map((link, index) => (
                    <SocialLink key={index} {...link} />
                ))}
            </nav>
            
            <hr className="md:hidden w-full border-primary-foreground/20 my-4" />
            
            <aside className="flex items-center gap-4">
                <DSZeroLogo width={60} height={60} className="flex-shrink-0 text-white" />
                <div className="flex flex-col text-xs md:text-sm text-primary-foreground/80">
                    <p>&copy; {new Date().getFullYear()} CompartiLar. Todos os direitos reservados.</p>
                    <p>Desenvolvido por DSZero Consultoria</p>
                    <p>Powered by ⌨</p>
                </div>
            </aside>
        </div>
    </footer>
);

export default Footer;