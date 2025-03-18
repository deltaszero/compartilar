import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConceptContentProps } from "./types";

export default function ConceptContent({ onGetStartedClick }: ConceptContentProps) {
    return (
        <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-white p-6 border-2 border-black shadow-brutalist font-nunito">
                <p className="text-sm sm:text-lg">
                    O <strong>CompartiLar</strong> foi idealizado em 2020 pela <Link href="http://lattes.cnpq.br/7746942732180282" target="_blank" rel="noopener noreferrer" className="text-main font-semibold">Dra. Isadora Urel</Link>, advogada especialista em Direito das Famílias, durante sua pesquisa de doutorado <strong>&quot;Plano Parental, Um Plano de Amor&quot;</strong>, orientada pelo <Link href="http://lattes.cnpq.br/4853414754033726" target="_blank" rel="noopener noreferrer" className="text-main font-semibold">Dr. Oswaldo Peregrina Rodrigues</Link>.
                </p>
                <p className="text-sm sm:text-lg mt-4">
                    Desenvolvido com base em mais de uma década de experiência prática e pesquisa acadêmica, o CompartiLar vai te ajudar a estabelecer rotinas mais saudáveis para seus filhos.
                </p>
                <p className="text-sm sm:text-lg mt-4">
                    As funcionalidades do CompartiLar foram pensadas para simplificar os desafios mais comuns enfrentados por famílias que vivem a realidade da coparentalidade. Entre elas estão:
                </p>
                <ul className="text-sm sm:text-lg mt-4 list-none space-y-2">
                    <li>✅ <strong>Gerador de Plano Parental</strong></li>
                    <li>✅ <strong>Agenda compartilhada</strong></li>
                    <li>✅ <strong>Gerenciamento compartilhado de despesas</strong></li>
                    <li>✅ <strong>Sistema de check-in baseado em geolocalização</strong></li>
                </ul>
                <div className="mt-6 flex justify-end">
                    <Button
                        variant="default"
                        className="bg-mainStrongGreen text-lg flex items-center font-raleway font-bold"
                        onClick={onGetStartedClick}
                    >
                        <span>
                            Cadastre-se
                        </span>
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}