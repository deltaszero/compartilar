'use client';

import React from 'react';
import Link from 'next/link';
import { Youtube, Instagram, MessageCircle } from 'lucide-react';

const socialLinks = [
    {
        Icon: Instagram,
        label: '@compartilar',
        href: 'https://instagram.com/@compartilar'
    },
    {
        Icon: Youtube,
        label: '@compartilarYT',
        href: 'https://youtube.com/@compartilar'
    },
    {
        Icon: MessageCircle,
        label: 'Contato',
        href: 'mailto:contato@compartilar.com'
    }
];

interface SocialLinkProps {
    Icon: React.ElementType;
    label: string;
    href: string;
}

const SocialLink = ({ Icon, label, href }: SocialLinkProps) => (
    <Link
        href={href}
        className="flex items-center gap-2 p-2 hover:text-gray-600 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
    >
        <Icon className="w-5 h-5" />
        <span className="md:hidden lg:inline">{label}</span>
    </Link>
);

const Footer = () => (
    <footer className="px-6 py-8 bg-gray-100 border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-col md:flex-row items-center md:items-start md:gap-4">
                {socialLinks.map((link, index) => (
                    <SocialLink key={index} {...link} />
                ))}
            </nav>
            
            <hr className="md:hidden w-full border-gray-300 my-4" />
            
            <aside className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex flex-col text-xs md:text-sm text-gray-600">
                    <p>&copy; {new Date().getFullYear()} CompartiLar. Todos os direitos reservados.</p>
                    <p>Desenvolvido por DSZero Consultoria</p>
                    <p>Powered by ⌨</p>
                </div>
            </aside>
        </div>
    </footer>
);

export default Footer;