import { cn } from "@/lib/utils";
// import SectionTitle from "../SectionTitle";
import ConceptContent from "./ConceptContent";
import TeseImagesStack from "./TeseImagesStack";
import { ConceptSectionProps } from "./types";

export default function ConceptSection({ onGetStartedClick, openImageModal }: ConceptSectionProps) {
  return (
    <>
      {/* Descomplique Section */}
      <section className="px-4 sm:px-[8em] bg-bg pb-12" id="descomplique">
        <div className="sm:w-3/4 mx-auto">
          <div className="flex justify-center py-12">
            <h2 className={cn(
              "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
              "px-6 py-3 text-xl sm:text-4xl font-bold",
            )}>
              Mais de 10 anos de experiência em um aplicativo
            </h2>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-10 items-start sm:py-12">
            <ConceptContent onGetStartedClick={onGetStartedClick} />
            <TeseImagesStack openImageModal={openImageModal} />
          </div>
        </div>
      </section>

      {/* Organize Section */}
      {/* <section className="w-full bg-white px-4 sm:px-6 lg:px-8 py-[4em]" id="organize">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center pb-8">
            <h2 className={cn(
              "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
              "px-6 py-3 text-xl sm:text-4xl font-bold",
            )}>
              Organize
            </h2>
          </div>
          <p className="text-center text-lg sm:text-xl max-w-3xl mx-auto">
            Mantenha todas as informações importantes dos seus filhos organizadas e acessíveis.
          </p>
        </div>
      </section> */}

      {/* Proteja Section */}
      {/* <section className="w-full bg-bg px-4 sm:px-6 lg:px-8 py-[4em]" id="proteja">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center pb-8">
            <h2 className={cn(
              "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
              "px-6 py-3 text-xl sm:text-4xl font-bold",
            )}>
              Proteja
            </h2>
          </div>
          <p className="text-center text-lg sm:text-xl max-w-3xl mx-auto">
            Seus dados são protegidos com a mais alta segurança, permitindo compartilhamento controlado.
          </p>
        </div>
      </section> */}

      {/* Despreocupe-se Section */}
      {/* <section className="w-full bg-white px-4 sm:px-6 lg:px-8 py-[4em]" id="despreocupe-se">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center pb-8">
            <h2 className={cn(
              "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
              "px-6 py-3 text-xl sm:text-4xl font-bold",
            )}>
              Despreocupe-se
            </h2>
          </div>
          <p className="text-center text-lg sm:text-xl max-w-3xl mx-auto">
            A gente lembra você de tudo o que precisa ser feito para garantir o bem-estar dos seus filhos.
          </p>
        </div>
      </section> */}
    </>
  );
}