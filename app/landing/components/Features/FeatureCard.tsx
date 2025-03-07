import Image from "next/image";
import { FeatureCardProps } from "./types";

export default function FeatureCard({ feature, onClick, isMobile }: FeatureCardProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(feature.id);
  };

  return (
    <div
      key={feature.id}
      className="hover:scale-105 transition-transform duration-300 cursor-pointer bg-white border-2 border-black rounded-none p-3 sm:p-5 shadow-brutalist"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center pt-0 sm:pt-6">
        {feature.img ? (
          <Image
            src={feature.img}
            alt={feature.title}
            width={isMobile ? 150 : 256}
            height={isMobile ? 150 : 256}
            className="object-cover mb-2 sm:mb-4"
          />
        ) : (
          <div className="w-full h-[150] sm:h-[256px] bg-gray-200 border border-black mb-2 sm:mb-4"></div>
        )}
        <h3 className="font-bold text-sm sm:text-2xl mb-1 sm:mb-2 text-center pb-1 sm:pb-0">
          {feature.title}
        </h3>
        <p className="font-light text-xs sm:text-xl text-center text-black">
            {feature.description}
        </p>
      </div>
    </div>
  );
}