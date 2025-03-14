import React, { forwardRef } from "react";
import Image from "next/image";
import { cn } from '@/app/lib/utils';
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero_image from "@assets/images/landing_compartilar-hero-01.png";
import { HeroProps } from "./types";

const Hero = forwardRef<HTMLDivElement, Omit<HeroProps, 'heroRef'>>((props, ref) => {
    const { onLearnMoreClick, onGetStartedClick, isMobile } = props;

    return (
        <section className="bg-bg" ref={ref}>
            <div className={cn(
                "flex flex-col gap-8 items-center justify-between mx-auto ",
                "sm:max-w-[80%] sm:py-24 sm:mb-[8em] sm:flex-row-reverse",
            )}>
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
                <div className="relative px-2 sm:px-6 lg:px-8 py-2 sm:py-16 lg:py-24">
                    <div className="max-w-4xl">
                        <h1 className={cn(
                            "text-4xl mb-4 font-bold font-raleway",
                            "sm:text-4xl sm:mb-6",
                            "md:text-5xl",
                            "lg:text-6xl"
                        )}>
                            Simplifique a coparentalidade organizando tudo em um só lugar
                        </h1>

                        <p className={cn(
                            "mb-6 font-light font-nunito",
                            "sm:text-lg sm:mb-8 ",
                            "md:text-xl",
                            "lg:text-2xl"
                        )}>
                            Uma plataforma completa que ajuda pais a coordenar cuidados, despesas e rotinas dos filhos, trazendo harmonia e clareza para a família.
                        </p>

                        <div className="flex flex-row gap-4 mb-[5em]">
                            <Button
                                variant="default"
                                className="bg-main text-lg md:text-xl font-raleway font-bold"
                                onClick={onLearnMoreClick}
                            >
                                Saiba mais
                            </Button>
                            <Button
                                variant="default"
                                className="flex items-center bg-mainStrongGreen font-raleway font-bold text-lg md:text-xl "
                                onClick={onGetStartedClick}
                            >
                                <span>
                                    Comece agora
                                </span>
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