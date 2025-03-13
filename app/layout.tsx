// app/layout.tsx
import Script from "next/script";
import Analytics from "@components/Analytics";
import {
    Inter,
    Raleway,
    Playfair_Display,
    Nunito,
    Cinzel_Decorative,
} from "next/font/google";
import { UserProvider } from "@context/userContext";
import type { Metadata } from "next";
import "@app/globals.css";

const inter = Inter({ subsets: ["latin"] });
const raleway = Raleway({
    subsets: ["latin"],
    variable: "--font-raleway",
});
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});
const nunito = Nunito({
    subsets: ["latin"],
    variable: "--font-nunito",
});
const cinzel = Cinzel_Decorative({
    subsets: ["latin"],
    variable: "--font-cinzel",
    weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
    title:
        "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
    description:
        "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.",
    keywords: [
        "coparentalidade aplicativo",
        "aplicativo coparentalidade",
        "aplicativo direito família",
        "coparentalidade",
    ],
    authors: [
        { name: "Isadora Urel", url: "https://isadoraurel.adv.br" },
        { name: "DSZero Consultoria", url: "https://dszero.com.br" },
    ],
    creator: "DSZero Consultoria",
    publisher: "DSZero Consultoria",
    alternates: {
        canonical: "https://compartilar.app",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    manifest: "/manifest.json",
    openGraph: {
        title:
            "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
        description:
            "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.",
        url: "https://compartilar.app",
        siteName: "CompartiLar",
        images: [
            {
                url: "https://compartilar.app/images/card.png",
                alt: "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
                width: 512,
                height: 512,
            },
        ],
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title:
            "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
        description:
            "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível.",
        images: ["https://compartilar.app/images/card.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    
    return (
        <html
            data-theme="light"
            suppressHydrationWarning
            className={`${raleway.variable} ${playfair.variable} ${nunito.variable} ${cinzel.variable} scroll-smooth antialiased`}
        >
            <head>
                <meta
                    name="viewport"
                    content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
                />
                <meta name="viewport" content="viewport-fit=cover" />
                {GA_MEASUREMENT_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga-script" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){window.dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GA_MEASUREMENT_ID}', {
                                    page_path: window.location.pathname,
                                    send_page_view: true
                                });
                            `}
                        </Script>
                    </>
                )}
            </head>
            <body className={`${inter.className}`}>
                <UserProvider>
                    <main>
                        {/* Only include Analytics component here, not in individual pages */}
                        <Analytics />
                        {children}
                    </main>
                </UserProvider>
            </body>
        </html>
    );
}
