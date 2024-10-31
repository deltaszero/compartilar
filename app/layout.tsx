import "@app/globals.css";
import { 
    Inter,
    // Raleway,
    // Playfair_Display,
    // Cinzel_Decorative
} from 'next/font/google';
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

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
        <html 
            lang="pt-BR" data-theme="forest" className="scroll-smooth antialiased" suppressHydrationWarning>
            <body className={`${inter.className} flex h-full flex-col`}>
                <main className="grow">
                    {children}
                </main>
            </body>
        </html>
    );
}
