"use client";

import { Inter } from "next/font/google";
import "../globals.css";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm p-4">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="relative w-32 h-8">
                  <Image 
                    src="/images/compartilar-typologo.svg" 
                    alt="CompartiLar Logo" 
                    fill
                    priority 
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </Link>
              <div className="flex space-x-4">
                <Link href="/login" className="text-sm font-medium hover:text-primary">
                  Entrar
                </Link>
                <Link href="/signup" className="text-sm font-medium text-white bg-primary px-4 py-2 rounded-md hover:bg-primary-dark">
                  Cadastrar
                </Link>
              </div>
            </div>
          </header>
          
          <main className="flex-grow">{children}</main>
          
          <footer className="bg-gray-100 p-4 mt-auto">
            <div className="container mx-auto text-center text-sm text-gray-600">
              <p>© {new Date().getFullYear()} CompartiLar. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}