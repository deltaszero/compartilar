import "./globals.css";
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import { 
    Inter,
    // Raleway,
    // Playfair_Display,
    // Cinzel_Decorative
} from 'next/font/google';
import type { Metadata } from "next";
// import localFont from "next/font/local";
// import {
//     ClerkProvider,
// } from '@clerk/nextjs'
// import Header from "@components/layout/Header";

// const geistSans = localFont({
//     src: "./fonts/GeistVF.woff",
//     variable: "--font-geist-sans",
//     weight: "100 900",
// });
// const geistMono = localFont({
//     src: "./fonts/GeistMonoVF.woff",
//     variable: "--font-geist-mono",
//     weight: "100 900",
// });
const inter = Inter({ subsets: ["latin"] });

// const playfair_display = Playfair_Display({
//     subsets: ["latin"],
// });
// const raleway = Raleway({ 
//     subsets: ["latin"],
//     weight: ['400', '500', '600', '700', '800', '900'],
// });
// const cinzel_decorative = Cinzel_Decorative({
//     subsets: ["latin"],
//     weight: ['400', '700', '900'],
// });

export const metadata: Metadata = {
    title: "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
    description: "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // <ClerkProvider>
            <html 
                lang="pt-BR" data-theme="forest" className="scroll-smooth antialiased" suppressHydrationWarning>
                <body className={`${inter.className} flex h-full flex-col`}>
                    <Header />
                    <main className="grow">
                        {children}
                    </main>
                    <Footer />
                </body>
            </html>
        // </ClerkProvider>
    );
}
