import "@app/globals.css";
import {
    Inter,
    // Raleway,
    // Playfair_Display,
    // Cinzel_Decorative
} from 'next/font/google';
import type { Metadata } from "next";
import Script from 'next/script';
import { UserProvider } from '@context/userContext';
import Analytics from '@components/Analytics';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
    description: "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.",
    keywords: [
        "coparentalidade aplicativo",
        "aplicativo coparentalidade",
        "aplicativo direito família",
        "coparentalidade",
    ],
    authors: [
        { name: 'Isadora Urel', url: 'https://isadoraurel.adv.br' },
        { name: 'DSZero Consultoria', url: 'https://dszero.com.br' },
    ],
    creator: 'DSZero Consultoria',
    publisher: 'DSZero Consultoria',
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
            <head>
                {/* Google Analytics */}
                <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`}
                    strategy="afterInteractive"
                />
                <Script id="ga-script" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){window.dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}');
                    `}
                </Script>
            </head>
            <body className={`${inter.className} flex h-full flex-col`}>
                <UserProvider>
                    <main className="grow">
                        <Analytics />
                        {children}
                    </main>
                </UserProvider>
            </body>
        </html>
    );
}
