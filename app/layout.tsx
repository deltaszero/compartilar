// app/layout.tsx
import type { Metadata } from "next";
import {
    Inter,
    Raleway,
    Playfair_Display,
    Nunito,
} from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

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

export const metadata: Metadata = {
    title: "CompartiLar - Facilite a coparentalidade organizando tudo em um só lugar!",
    description: "Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            className={`${raleway.variable} ${playfair.variable} ${nunito.variable} scroll-smooth antialiased`}
        >
            <body className={`${inter.className}`}>
                <ClientLayout>
                    <main>
                        {children}
                    </main>
                </ClientLayout>
            </body>
        </html>
    );
}
