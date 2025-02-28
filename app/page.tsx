// app/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
// assets
import hero_img from "@assets/images/compartilar-anthropic-hero.png";
import feature_img from "@assets/images/compartilar-anthropic-img-01.png";

export default function Home() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener('resize', checkMobileScreen);
        return () => window.removeEventListener('resize', checkMobileScreen);
    }, []);

    return (
        <section className="flex flex-col">
            {/* HEADER */}
            <Header />
            {/* HERO */}
            <section className="hero bg-base-200">
                <div className="hero-content flex-col lg:flex-row-reverse sm:py-24">
                    <Image
                        src={hero_img}
                        alt="Hero image"
                        width={isMobile ? 256 : 540}
                    />
                    {/* - */}
                    <div className="
                        container relative z-10 mx-auto
                        px-2 sm:px-6 lg:px-8
                        py-2 sm:py-16 lg:py-24
                    ">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold mb-4 sm:mb-6">
                                Facilite a coparentalidade organizando tudo em um só lugar
                            </h1>

                            <p className="font-raleway font-light sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 leading-[1em]">
                                Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.
                            </p>

                            <div className='flex flex-row gap-4 mb-[5em]'>
                                <button className="btn btn-outline inline-flex items-center px-6  text-base sm:text-lg md:text-xl  font-nunito font-bold rounded-md">
                                    <span>Saiba mais</span>
                                </button>
                                <button className="btn bg-neutral text-neutral-content border-none group inline-flex items-center px-6 sm:text-lg md:text-xl  font-nunito font-bold rounded-md hover:text-neutral">
                                    <span>Comece agora</span>
                                    <svg
                                        className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    >
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M12.75 22.5 23.25 12 12.75 1.5"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="flex flex-row bg-base-200 justify-center items-center text-center py-12 font-raleway font-bold text-4xl">
                Principais funcionalidades
            </div>
            <div className='flex flex-col justify-center gap-6 py-12 bg-base-200 sm:flex-row'>
                {[
                    {
                        id: 'descomplique',
                        title: 'Plano Parental',
                        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies.'
                    },
                    {
                        id: 'organize',
                        title: 'Organize',
                        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies.'
                    },
                    {
                        id: 'proteja',
                        title: 'Proteja',
                        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies.'
                    },
                    {
                        id: 'despreocupe-se',
                        title: 'Despreocupe-se',
                        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies.'
                    }
                ].map(feature => (
                    <section key={feature.id} className="flex flex-col items-center w-full sm:w-1/5 px-2" id={feature.id}>
                        <Image
                            src={feature_img}
                            alt="Feature image"
                            width={256}
                        />
                        <h2 className="font-raleway font-bold text-2xl">
                            {feature.title}
                        </h2>
                        <p className="font-serif font-light text-xl text-center">
                            {feature.description}
                        </p>
                    </section>
                ))}
            </div>
            {/* FOOTER */}
            <footer>
                <Footer />
            </footer>
        </section>
    );
}