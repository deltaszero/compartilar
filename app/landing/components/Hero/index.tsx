import React, { forwardRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero_image from "@assets/images/landing_compartilar-hero-01.png";
import { HeroProps } from "./types";

const Hero = forwardRef<HTMLDivElement, Omit<HeroProps, 'heroRef'>>((props, ref) => {
    const { onLearnMoreClick, onGetStartedClick, isMobile } = props;

    return (
        <section className="bg-bg" ref={ref}>
            <div className="container flex flex-col lg:flex-row-reverse items-center justify-between gap-8 sm:py-24 mx-auto sm:mb-[8em]">
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
                            Simplifique a coparentalidade organizando tudo em um só lugar
                        </h1>

                        <p className="font-light sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-muted-foreground">
                            Uma plataforma completa que ajuda pais a coordenar cuidados, despesas e rotinas dos filhos, trazendo harmonia e clareza para a família.
                        </p>

                        <div className="flex flex-row gap-4 mb-[5em]">
                            <Button
                                variant="default"
                                className="bg-main text-base sm:text-lg md:text-xl"
                                onClick={onLearnMoreClick}
                            >
                                Saiba mais
                            </Button>
                            <Button
                                variant="default"
                                className="bg-mainStrongGreen text-base sm:text-lg md:text-xl flex items-center"
                                onClick={onGetStartedClick}
                            >
                                <span>Comece agora</span>
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

Hero.displayName = "Hero";

export default Hero;