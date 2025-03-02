// app/page.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Analytics, {
    trackEvent,
    AnalyticsEventType,
} from "@/app/components/Analytics";
// assets
import hero_img from "@assets/images/compartilar-anthropic-hero.png";
import feature_img from "@assets/images/compartilar-anthropic-img-01.png";

// Features data
const features = [
    {
        id: "plano-parental",
        title: "Plano Parental",
        description:
            "Crie e gerencie um plano de parentalidade completo para organizar as responsabilidades, rotinas e acordos importantes sobre seus filhos.",
        analyticsId: "feature_parental_plan",
    },
    {
        id: "organize",
        title: "Organize",
        description:
            "Mantenha todas as informações importantes dos seus filhos organizadas: documentos, saúde, educação e muito mais em um só lugar.",
        analyticsId: "feature_organize",
    },
    {
        id: "proteja",
        title: "Proteja",
        description:
            "Seus dados são protegidos com a mais alta segurança, permitindo o compartilhamento apenas com quem você autorizar.",
        analyticsId: "feature_protect",
    },
    {
        id: "despreocupe-se",
        title: "Despreocupe-se",
        description:
            "Nunca mais se preocupe com informações perdidas ou comunicação confusa. Tenha tudo ao seu alcance quando precisar.",
        analyticsId: "feature_peace_of_mind",
    },
];

export default function Home() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const [visibleSections, setVisibleSections] = useState<Set<string>>(
        new Set()
    );

    console.log(visibleSections);

    // Track screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    // Track section visibility
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleScroll = () => {
            const observe = (
                ref: React.RefObject<HTMLElement>,
                sectionId: string
            ) => {
                if (!ref.current) return;

                const rect = ref.current.getBoundingClientRect();
                const windowHeight =
                    window.innerHeight || document.documentElement.clientHeight;
                const isVisible =
                    rect.top <= windowHeight * 0.75 && rect.bottom >= windowHeight * 0.25;

                setVisibleSections((prev) => {
                    const newSet = new Set(prev);
                    if (isVisible && !prev.has(sectionId)) {
                        trackEvent(AnalyticsEventType.SECTION_VIEW, {
                            section_id: sectionId,
                        });
                        newSet.add(sectionId);
                    }
                    return newSet;
                });
            };

            observe(heroRef, "hero");
            observe(featuresRef, "features");
        };

        // Initial check
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Track first visitor session
    useEffect(() => {
        if (typeof sessionStorage !== "undefined") {
            const hasVisited = sessionStorage.getItem("hasVisited");
            if (!hasVisited) {
                trackEvent(AnalyticsEventType.PAGE_VIEW, {
                    is_first_visit: true,
                    landing_page: "home",
                    referrer: document.referrer,
                });
                sessionStorage.setItem("hasVisited", "true");
            }
        }
    }, []);

    // Handle CTA clicks
    const handleLearnMoreClick = () => {
        trackEvent(AnalyticsEventType.CTA_CLICK, {
            cta_id: "learn_more",
            cta_text: "Saiba mais",
            cta_position: "hero_section",
        });
        // Scroll to features section
        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGetStartedClick = () => {
        trackEvent(AnalyticsEventType.CTA_CLICK, {
            cta_id: "get_started",
            cta_text: "Comece agora",
            cta_position: "hero_section",
        });
        router.push("/signup");
    };

    const handleFeatureClick = (featureId: string, analyticsId: string) => {
        trackEvent(AnalyticsEventType.FEATURE_CLICK, {
            feature_id: featureId,
            feature_analytics_id: analyticsId,
            feature_position: Array.from(features).findIndex(
                (f) => f.id === featureId
            ),
        });
    };

    return (
        <section className="flex flex-col">
            {/* Include Analytics component */}
            <Analytics />

            {/* HEADER */}
            <Header />

            {/* HERO */}
            <section className="hero bg-base-200" ref={heroRef}>
                <div className="hero-content flex-col lg:flex-row-reverse sm:py-24">
                    <Image
                        src={hero_img}
                        alt="Hero image"
                        width={isMobile ? 256 : 540}
                        className="animate-fade-in-up"
                        priority
                        onLoad={() =>
                            trackEvent(AnalyticsEventType.PAGE_VIEW, {
                                element_loaded: "hero_image",
                                load_time: performance.now(),
                            })
                        }
                    />
                    <div
                        className="
                        container relative z-10 mx-auto
                        px-2 sm:px-6 lg:px-8
                        py-2 sm:py-16 lg:py-24
                    "
                    >
                        <div className="max-w-4xl animate-fade-in">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold mb-4 sm:mb-6">
                                Facilite a coparentalidade organizando tudo em um só lugar
                            </h1>

                            <p className="font-raleway font-light sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 leading-[1em]">
                                Uma plataforma feita para você manter todas as informações
                                importantes sobre seus filhos de forma segura e acessível,
                                facilitando o planejamento e a comunicação, trazendo clareza e
                                harmonia para a sua família.
                            </p>

                            <div className="flex flex-row gap-4 mb-[5em]">
                                <button
                                    className="btn btn-outline inline-flex items-center px-6 text-base sm:text-lg md:text-xl font-nunito font-bold rounded-md"
                                    onClick={handleLearnMoreClick}
                                    aria-label="Saiba mais sobre o CompartiLar"
                                >
                                    <span>Saiba mais</span>
                                </button>
                                <button
                                    className="btn bg-neutral text-neutral-content border-none group inline-flex items-center px-6 sm:text-lg md:text-xl font-nunito font-bold rounded-md hover:text-neutral"
                                    onClick={handleGetStartedClick}
                                    aria-label="Crie sua conta no CompartiLar"
                                >
                                    <span>Comece agora</span>
                                    <svg
                                        className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12.75 22.5 23.25 12 12.75 1.5"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <div
                ref={featuresRef}
                className="flex flex-row bg-base-200 justify-center items-center text-center py-12 font-raleway font-bold text-4xl"
            >
                Principais funcionalidades
            </div>
            <div className="flex flex-col justify-center gap-6 py-12 bg-base-200 sm:flex-row">
                {features.map((feature, index) => (
                    <section
                        key={feature.id}
                        className="flex flex-col items-center w-full sm:w-1/5 px-2 hover:scale-105 transition-transform duration-300 cursor-pointer animate-fade-in"
                        id={feature.id}
                        onClick={() => handleFeatureClick(feature.id, feature.analyticsId)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Saiba mais sobre ${feature.title}`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleFeatureClick(feature.id, feature.analyticsId);
                            }
                        }}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <Image
                            src={feature_img}
                            alt={`${feature.title} image`}
                            width={256}
                            className="mb-4"
                        />
                        <h2 className="font-raleway font-bold text-2xl mb-2">
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

            {/* Add CSS for animations */}
            <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
        </section>
    );
}
