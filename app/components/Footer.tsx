'use client';

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from "next/image";
import { 
    Youtube, 
    Instagram,
    Twitter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/lib/utils';
// assets
import DSZeroLogo from '@/app/assets/icons/landing_dszero-logo-02.svg';
import social_media from "@assets/images/social-media.webp";

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
    {
        Icon: Twitter,
        label: '@compartilar',
        href: 'https://tiktok.com/@compartilar'
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
        className="flex items-center gap-2 justify-center"
        target="_blank"
        rel="noopener noreferrer"
    >
        <Icon className="w-6 h-6" />
        <span className="md:hidden lg:inline">{label}</span>
    </Link>
);

export default function Footer() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    return (
        <footer className={cn(
            "px-6 py-8 bg-bg text-primary-foreground",
            "border-t"
        )}>
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

                <Image
                    src={social_media}
                    alt="Redes sociais"
                    width={isMobile ? 128 : 256}
                    height={isMobile ? 128 : 256}
                    className="object-cover mb-2 sm:mb-4"
                />
                <nav className="flex flex-col items-center md:items-start md:gap-2">
                    {socialLinks.map((link, index) => (
                        <SocialLink key={index} {...link} />
                    ))}
                </nav>

                {/* <hr className="md:hidden w-full border-primary-foreground/20 my-4" /> */}

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
}