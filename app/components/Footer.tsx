'use client';

import React from 'react';
import Link from 'next/link';
import DSZeroIcon from '@assets/icons/dszero.svg';
import IconTikTok from '@assets/icons/tiktok.svg';
import Youtube from '@assets/icons/youtube.svg';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <Button 
        variant="ghost" 
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
            <Icon width={24} height={24} />
            <span className="md:hidden lg:inline">{label}</span>
        </Link>
    </Button>
);

const Footer = () => (
    <footer className={cn(
        "px-6 py-8 bg-primary text-primary-foreground",
        "border-t"
    )}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-col md:flex-row items-center md:items-start md:gap-4">
                {socialLinks.map((link, index) => (
                    <SocialLink key={index} {...link} />
                ))}
            </nav>
            
            <Separator className="md:hidden bg-primary-foreground/20 w-full" />
            
            <aside className="flex items-center gap-4">
                <DSZeroIcon width={50} height={50} className="flex-shrink-0" />
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