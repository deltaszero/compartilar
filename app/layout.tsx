import "@app/globals.css";
import {
    Inter,
    // Raleway,
    // Playfair_Display,
    // Cinzel_Decorative
} from 'next/font/google';
import type { Metadata } from "next";
import { UserProvider } from '@context/userContext';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
    description: "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.",
    keywords: [
        "coparentalidade aplicativo",
        "aplicativo coparentalidade",
        "aplicativo direito família",
        "coparentalidade",
        "coparentalidade organizada",
        "coparentalidade saudável",
        "coparentalidade consciente",
        "coparentalidade positiva",
        "coparentalidade harmoniosa",
        "coparentalidade colaborativa",
        "coparentalidade compartilhada",
        "coparentalidade unida",
        "coparentalidade integrada",
        "coparentalidade conectada",
        "coparentalidade interligada",
        "coparentalidade interdependente",
        "coparentalidade interconectada",
    ],
    authors: [
        { name: 'Isadora Urel', url: 'https://isadoraurel.adv.br' },
        { name: 'DSZero Consultoria', url: 'https://dszero.com.br' },
    ],
    creator: 'DSZero Consultoria',
    publisher: 'DSZero Consultoria',
    // authors : "Co-Authored by Isadora Urel and DSZero Consultoria",
    
    // language: "pt-BR",
    // geo : {
    //     region: "BR",
    //     placename: "São Paulo, SP, Brasil",
    // },
    robots: "index, follow",
    openGraph: {
        title: 'CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!',
        description: 'Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.',
        url: 'https://compartilar.isadoraurel.adv.br',
        images: [
            {
                url: 'https://compartilar.isadoraurel.adv.br/images/card.png',
                alt: 'CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!',
                width: 512,
                height: 512,
            },
        ],
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            data-theme="forest"
            className="scroll-smooth antialiased"
            suppressHydrationWarning
        >
            <body className={`${inter.className} flex h-full flex-col`}>
                <UserProvider>
                    <main className="grow">
                        {children}
                    </main>
                </UserProvider>
            </body>
        </html>
    );
}
