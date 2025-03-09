import { forwardRef } from "react";
import SectionTitle from "../SectionTitle";
import { features } from "./data";
import FeatureCard from "./FeatureCard";

interface FeaturesProps {
  onFeatureClick: (id: string) => void;
  isMobile: boolean;
}

const Features = forwardRef<HTMLDivElement, FeaturesProps>(
  ({ onFeatureClick, isMobile }, ref) => {
    return (
      <>
        <div ref={ref}>
          <SectionTitle title="Soluções que transformam a coparentalidade" />
        </div>
        <div className="px-4 sm:px-[8em] bg-main justify-center pt-0 pb-12 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onClick={onFeatureClick}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </>
    );
  }
);

Features.displayName = "Features";

export default Features;