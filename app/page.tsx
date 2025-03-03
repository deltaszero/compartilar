"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Button } from "@/components/ui/button";

// assets
import hero_image from "@assets/images/landing_compartilar-hero-01.png";


// Features data
const features = [
    {
        id: "plano-parental",
        title: "Plano Parental",
        description:
            "Crie e gerencie um plano de parentalidade completo para organizar as responsabilidades."
    },
    {
        id: "organize",
        title: "Organize",
        description:
            "Mantenha todas as informações importantes dos seus filhos organizadas e acessíveis."
    },
    {
        id: "proteja",
        title: "Proteja",
        description:
            "Seus dados são protegidos com a mais alta segurança, permitindo compartilhamento controlado."
    },
    {
        id: "despreocupe-se",
        title: "Despreocupe-se",
        description:
            "Nunca mais se preocupe com informações perdidas ou comunicação confusa."
    },
];

export default function Home() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    console.log(isMobile);

    // Track screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    // Handle CTA clicks
    const handleLearnMoreClick = () => {
        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGetStartedClick = () => {
        router.push("/signup");
    };

    const handleFeatureClick = (featureId: string) => {
        console.log(`Feature clicked: ${featureId}`);
    };

    return (
        <section className="flex flex-col">
            {/* HEADER */}
            <Header />

            {/* HERO */}
            <section className="bg-bg" ref={heroRef}>
                <div className="container flex flex-col lg:flex-row-reverse items-center justify-between gap-8 sm:py-24 mx-auto">
                    <Image
                        src={hero_image}
                        alt="Hero image"
                        width={isMobile ? 256 : 540}
                        height={isMobile ? 256 : 540}
                        className="animate-fade-in-up"
                        priority={true}
                        loading="eager"
                        fetchPriority="high"
                    />
                    <div className="relative z-10 px-2 sm:px-6 lg:px-8 py-2 sm:py-16 lg:py-24">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground">
                                Facilite a coparentalidade organizando tudo em um só lugar
                            </h1>

                            <p className="font-light sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-muted-foreground">
                                Uma plataforma feita para você manter todas as informações
                                importantes sobre seus filhos de forma segura e acessível.
                            </p>

                            <div className="flex flex-row gap-4 mb-[5em]">
                                <Button
                                    variant="neutral"                                
                                    className="text-base sm:text-lg md:text-xl"
                                    onClick={handleLearnMoreClick}
                                >
                                    Saiba mais
                                </Button>
                                <Button
                                    className="text-base sm:text-lg md:text-xl flex items-center"
                                    onClick={handleGetStartedClick}
                                >
                                    <span>Comece agora</span>
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <div
                ref={featuresRef}
                className="flex flex-row bg-muted justify-center items-center text-center py-12 font-bold text-4xl"
            >
                Principais funcionalidades
            </div>
            <div className="flex flex-col justify-center gap-6 py-12 bg-muted sm:flex-row container mx-auto">
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        id={feature.id}
                        className="w-full sm:w-1/5 hover:scale-105 transition-transform duration-300 cursor-pointer border border-gray-300 rounded-lg p-4"
                        onClick={() => handleFeatureClick(feature.id)}
                    >
                        <div className="flex flex-col items-center pt-6">
                            <div className="w-[256px] h-[156px] bg-gray-200 rounded-lg mb-4"></div>
                            <h3 className="font-bold text-2xl mb-2 text-center">
                                {feature.title}
                            </h3>
                            <p className="font-light text-xl text-center text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <Footer />
        </section>
    );
}
