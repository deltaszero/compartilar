import Image from "next/image";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import screenshots_01 from "@assets/images/screenshot-00.jpeg";

export default function FeatureScreenshots() {
    const [isMobile, setIsMobile] = useState(false);
    // Track screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);
    // Navigate to the corresponding section
    const handleFeatureClick = (featureId: string) => {
        const sectionElement = document.getElementById(featureId);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: "smooth" });
        } else {
            console.log(`Section with ID ${featureId} not found`);
        }
    };
    return (
        <div className="px-4 sm:px-[8em] bg-bg pb-12" id="saiba-mais">
            <div className="sm:w-3/4 mx-auto">
                <div className="flex justify-center py-12">
                    <h2 className={cn(
                        "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
                        "px-6 py-3 text-xl sm:text-4xl font-bold",
                        "text-center"
                    )}>
                        Mais de 10 anos de experiência em 1 aplicativo
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row-reverse gap-12 justify-center items-center">
                    <div className="bg-white p-6 border-2 border-black shadow-brutalist sm:w-1/2">
                        <p className="text-sm sm:text-lg">
                            O <strong>Compartilar</strong>, foi idealizado em 2020, durante a escrita da tese de doutorado da professora e advogada familiarista <strong>Isadora Urel</strong>, com o objetivo de auxiliar famílias que vivem a realidade da coparentalidade.
                        </p>
                        <p className="text-sm sm:text-lg mt-6">
                            <strong>Baseado na experiência de mais de 10 anos de atuação na área do Direito das Famílias</strong>, o Compartilar foi desenvolvido para auxiliar a solução de problemas recorrentes na rotina de famílias que passaram por processos de divórcio e precisam orquestrar a vida dos filhos em lares distintos.
                        </p>

                        <p className="text-sm sm:text-lg mt-6">
                            Entre as principais funções estão:
                        </p>

                        <ul className="text-sm sm:text-lg mt-6">
                            <li onClick={() => handleFeatureClick("descomplique")}>✅ &nbsp; <strong>Gerador de <span className="cursor-pointer text-main">Plano de Parental</span></strong></li>
                            <li>✅ &nbsp; <strong>Agenda compartilhada</strong></li>
                            <li>✅ &nbsp; <strong>Gereneciamento compartilhado de despesas</strong></li>
                            <li>✅ &nbsp; <strong>Sistema de check-in baseado em geolocalização</strong></li>
                        </ul>
                    </div>

                    <Image
                        src={screenshots_01}
                        alt="Screenshot do aplicativo"
                        width={isMobile ? 728 : 1024}
                        className="w-5/6 sm:w-1/2"
                    />
                </div>
            </div>
        </div>
    );
}