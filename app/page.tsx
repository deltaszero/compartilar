"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, BookOpen, Users, Calendar, X } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem, 
    CarouselNext, 
    CarouselPrevious 
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
// assets
import hero_image from "@assets/images/landing_compartilar-hero-01.png";
import feature_image_01 from "@assets/images/landing_compartilar-anthropic-img-01.png";
import tese_01 from "@assets/images/tese-01.png";
import tese_02 from "@assets/images/tese-02.png";
import tese_03 from "@assets/images/tese-03.png";


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
    const [api, setApi] = useState<any>(null);
    const [current, setCurrent] = useState(0);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ src: any; alt: string } | null>(null);
    
    // Thesis pages data
    const thesisPages = [
        { src: tese_01, alt: "Primeira página da tese sobre Plano Parental" },
        { src: tese_02, alt: "Segunda página da tese sobre Plano Parental" },
        { src: tese_03, alt: "Terceira página da tese sobre Plano Parental" },
    ];

    // Track screen size
    // Carousel navigation
    useEffect(() => {
        if (!api) return;
        
        const handleSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };
        
        api.on("select", handleSelect);
        return () => {
            api.off("select", handleSelect);
        };
    }, [api]);

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
    
    const openImageModal = (image: any, alt: string) => {
        setSelectedImage({ src: image, alt });
        setImageModalOpen(true);
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
                                    variant="default"
                                    className="bg-main text-base sm:text-lg md:text-xl"
                                    onClick={handleLearnMoreClick}
                                >
                                    Saiba mais
                                </Button>
                                <Button
                                    variant="default"
                                    className="bg-mainStrongGreen text-base sm:text-lg md:text-xl flex items-center"
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

            {/* PLANO PARENTAL SCIENTIFIC CONCEPT SECTION */}
            <section className="w-full bg-bg py-16 px-4 sm:px-6 lg:px-8 pb-[6em]">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center mb-12">
                        <h2 className={cn(
                            "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
                            "px-6 py-3 text-3xl sm:text-4xl font-bold"
                        )}>
                            O Conceito de Plano Parental
                        </h2>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-10 items-center">
                        <div className="lg:w-1/2 space-y-6">
                            <div className="bg-white p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-lg">
                                    O <strong>Plano Parental</strong> é uma abordagem estruturada para organizar a coparentalidade, 
                                    baseada em pesquisa científica. Documentos e estudos acadêmicos mostram que crianças se 
                                    desenvolvem melhor quando há uma comunicação clara e rotinas previsíveis entre os 
                                    adultos responsáveis por seus cuidados.
                                </p>
                                <p className="text-lg mt-4">
                                    Este conceito foi apresentado e desenvolvido em trabalhos acadêmicos, como ilustrado nas 
                                    páginas da tese de doutorado que inspirou o CompartiLar.
                                </p>
                                <div className="mt-6">
                                    <Button 
                                        variant="default" 
                                        className="bg-mainStrongGreen text-lg flex items-center"
                                        onClick={handleGetStartedClick}
                                    >
                                        <span>Comece seu Plano Parental</span>
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="lg:w-1/2">
                            <div className="w-full rounded-xl overflow-hidden border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
                                    <CarouselContent>
                                        {thesisPages.map((page, index) => (
                                            <CarouselItem key={index}>
                                                <Card className="border-none shadow-none bg-transparent">
                                                    <CardContent className="p-0">
                                                        <div className="relative w-full h-[400px] sm:h-[500px]">
                                                            {/* Page image */}
                                                            <Image
                                                                src={page.src}
                                                                alt={page.alt}
                                                                fill
                                                                className="object-contain cursor-pointer"
                                                                onClick={() => openImageModal(page.src, page.alt)}
                                                            />
                                                            
                                                            {/* Overlay with view button */}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                                                                <div 
                                                                    className="p-3 rounded-full bg-white opacity-0 hover:opacity-100 transition-opacity transform hover:scale-110 shadow-lg cursor-pointer"
                                                                    onClick={() => openImageModal(page.src, page.alt)}
                                                                >
                                                                    <ExternalLink className="h-6 w-6 text-mainStrongGreen" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    
                                    <CarouselPrevious className="left-2 bg-white border-2 border-black" />
                                    <CarouselNext className="right-2 bg-white border-2 border-black" />
                                    
                                    {/* Indicator dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                        {thesisPages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => api?.scrollTo(index)}
                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                    index === current ? 'bg-mainStrongGreen' : 'bg-black/40 hover:bg-black/60'
                                                }`}
                                                aria-label={`Ir para página ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <Footer />
            
            {/* Image Modal */}
            <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 shadow-none [&>button]:hidden">
                    <DialogTitle className="sr-only">
                        {selectedImage?.alt || "Visualização de imagem do Plano Parental"}
                    </DialogTitle>
                    
                    {selectedImage && (
                        <div className="relative bg-transparent">
                            <button 
                                onClick={() => setImageModalOpen(false)}
                                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md z-50"
                                aria-label="Fechar visualização"
                            >
                                <X className="h-6 w-6 text-gray-700" />
                            </button>
                            <div className="flex items-center justify-center">
                                <Image 
                                    src={selectedImage.src} 
                                    alt={selectedImage.alt}
                                    width={800}
                                    height={1000}
                                    className="object-contain max-h-[85vh] rounded-lg"
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
