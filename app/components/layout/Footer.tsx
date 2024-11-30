// app/components/layout/Footer.tsx
'use client';
// importing modules
import React from 'react';
// importing assets
import DSZeroIcon from '@assets/icons/dszero.svg';
import TwitterIcon from '@assets/icons/twitter.svg';
import Youtube from '@assets/icons/youtube.svg';

const Footer = () => (
    <footer className="footer items-center p-4 bg-base-100 text-neutral ">
        <aside className="grid-flow-col items-center">
            <div className="flex items-center space-x-2 justify-center gap-2">
                <div className="flex items-center space-x-2">
                    <DSZeroIcon width={50} height={50} />
                </div>
                <div className="flex-column align-left">
                    <p>&copy; {new Date().getFullYear()} CompartiLar. Todos os direitos reservados.</p>
                    <p>Desenvolvido por DSZero Consultoria &mdash; powered by ⌨</p>
                </div>
            </div>
        </aside>
        <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
            <a>
                <TwitterIcon width={24} height={24} />
            </a>
            <a>
                <Youtube width={24} height={24} />
            </a>
        </nav>
    </footer>
);

export default Footer;