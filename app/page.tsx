"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// assets
import hero_image from "@assets/images/landing_compartilar-hero-01.png";
import feature_image_01 from "@assets/images/landing_compartilar-anthropic-img-01.png";


// Features data
const features = [
    {
        id: "plano-parental",
        title: "Plano Parental",
        description:
            "Crie e gerencie um plano de parentalidade completo para organizar as responsabilidades.",
        img: feature_image_01,
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
                className={cn(
                    "flex flex-row bg-bg justify-center items-center text-center font-bold text-4xl",
                    "py-12 px-4 sm:px-0"
                )}>
                <span className={cn(
                    "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
                    "px-6 py-3"
                )}>
                    Principais funcionalidades
                </span>
            </div>
            <div className="flex flex-col px-4 sm:px-0 bg-bg justify-center gap-8 py-12 bg-muted sm:flex-row mx-auto">
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        id={feature.id}
                        className="w-full sm:w-1/5 hover:scale-105 transition-transform duration-300 cursor-pointer bg-white border-2 border-black rounded-none p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                        onClick={() => handleFeatureClick(feature.id)}
                    >
                        <div className="flex flex-col items-center pt-6">
                            {feature.img ? (
                                <Image
                                    src={feature.img}
                                    alt={feature.title}
                                    width={256}
                                    height={156}
                                    className="object-cover mb-4"
                                />
                            ) : (
                                <div className="w-[256px] h-[156px] bg-gray-200 border border-black mb-4"></div>
                            )}
                            <h3 className="font-bold text-2xl mb-2 text-center border-b-2 border-black pb-2">
                                {feature.title}
                            </h3>
                            <p className="font-light text-xl text-center text-black">
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
