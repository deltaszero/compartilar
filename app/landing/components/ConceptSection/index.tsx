import { cn } from "@/lib/utils";
import SectionTitle from "../SectionTitle";
import ConceptContent from "./ConceptContent";
import TeseImagesStack from "./TeseImagesStack";
import { ConceptSectionProps } from "./types";

export default function ConceptSection({ onGetStartedClick, openImageModal }: ConceptSectionProps) {
  return (
    <section className="w-full bg-bg px-4 sm:px-6 lg:px-8 pb-[6em]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center py-12">
          <h2 className={cn(
            "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
            "px-6 py-3 text-xl sm:text-4xl font-bold",
          )}>
            O conceito de plano parental
          </h2>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-10 items-start sm:py-12">
          <ConceptContent onGetStartedClick={onGetStartedClick} />
          <TeseImagesStack openImageModal={openImageModal} />
        </div>
      </div>
    </section>
  );
}