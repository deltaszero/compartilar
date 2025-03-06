import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConceptContentProps } from "./types";

export default function ConceptContent({ onGetStartedClick }: ConceptContentProps) {
  return (
    <div className="w-full lg:w-1/2 space-y-6">
      <div className="bg-white p-6 border-2 border-black shadow-brutalist">
        <p className="text-sm sm:text-lg">
          O <strong>Plano Parental</strong> é uma estrutura criada para organizar a dinâmica da vida de crianças que vivem em mais de um lar.
        </p>
        <p className="text-sm sm:text-lg mt-4">
          Estudos indicam que <strong>crianças se desenvolvem melhor</strong> quando há uma comunicação clara e rotinas previsíveis entre os adultos responsáveis por seus cuidados.
        </p>
        <p className="text-sm sm:text-lg mt-4">
          <strong>O CompartiLar permite que você crie e gerencie um plano de parentalidade completo</strong>, organizando as responsabilidades e informações importantes sobre seus filhos.
        </p>
        <p className="text-sm sm:text-lg mt-4">
          Nosso plano parental é estruturado de acordo com a tese de doutorado <strong>&quot;Plano Parental, Um Plano de Amor&quot;</strong>, de autoria da <Link href="http://lattes.cnpq.br/7746942732180282" target="_blank" rel="noopener noreferrer" className="text-main font-semibold">Dra. Isadora Urel</Link> orientada pelo <Link href="http://lattes.cnpq.br/4853414754033726" target="_blank" rel="noopener noreferrer" className="text-main font-semibold">Dr. Oswaldo Peregrina Rodrigues</Link>.
        </p>
        <div className="mt-6">
          <Button 
            variant="default" 
            className="bg-mainStrongGreen text-lg flex items-center"
            onClick={onGetStartedClick}
          >
            <span>Crie seu Plano Parental</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}