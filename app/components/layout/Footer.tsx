'use client';

import React from 'react';
import DSZeroIcon from '@assets/icons/dszero.svg';
import IconTikTok from '@assets/icons/tiktok.svg';
import Youtube from '@assets/icons/youtube.svg';

const socialLinks = [
    {
        Icon: IconTikTok,
        label: '@compartilar',
        href: 'https://tiktok.com/@compartilar'
    },
    {
        Icon: Youtube,
        label: '@compartilar',
        href: 'https://youtube.com/@compartilar'
    }
];

interface SocialLinkProps {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    label: string;
    href: string;
}

const SocialLink = ({ Icon, label, href }: SocialLinkProps) => (
    <a
        href={href}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        target="_blank"
        rel="noopener noreferrer"
    >
        <Icon width={24} height={24} />
        <span className="md:hidden lg:inline">{label}</span>
    </a>
);

const Footer = () => (
    <footer className="footer items-center p-2 bg-base-100 text-neutral">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <nav className="flex flex-col md:gap-2">
                {socialLinks.map((link, index) => (
                    <SocialLink key={index} {...link} />
                ))}
            </nav>
            <aside className="flex items-center gap-2">
                <DSZeroIcon width={50} height={50} className="flex-shrink-0" />
                <div className="flex flex-col text-xs md:text-sm">
                    <p>&copy; {new Date().getFullYear()} CompartiLar. Todos os direitos reservados.</p>
                    <p>Desenvolvido por DSZero Consultoria</p>
                    <p>Powered by ⌨</p>
                </div>
            </aside>
        </div>
    </footer>
);

export default Footer;