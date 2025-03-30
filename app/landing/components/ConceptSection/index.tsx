import ConceptContent from "./ConceptContent";
import TeseImagesStack from "./TeseImagesStack";
import { ConceptSectionProps } from "./types";
import SectionTitle from "../SectionTitle";

export default function ConceptSection({ onGetStartedClick, openImageModal }: ConceptSectionProps) {
    return (
        <section className="bg-bg" id="concept">
            <div>
                <SectionTitle title="Mais de 10 anos de experiência em um aplicativo" />
            </div>

            <div className="px-4 pb-12 mx-auto xl:w-4/5">
                <div className="flex flex-col gap-4 items-start sm:py-12 lg:flex-row sm:gap-10">
                    <ConceptContent onGetStartedClick={onGetStartedClick} />
                    <TeseImagesStack openImageModal={openImageModal} />
                </div>
            </div>
        </section>
    );
}