import Image from "next/image";
import { FeatureCardProps } from "./types";
import { trackEvent, AnalyticsEventType } from "@/app/components/Analytics";
import { cn } from '@/lib/utils';

export default function FeatureCard({ feature, onClick, isMobile }: FeatureCardProps) {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Direct event tracking for better reliability
        trackEvent(AnalyticsEventType.FEATURE_CLICK, {
            feature_id: feature.id,
            feature_name: feature.title,
            // Remove the non-existent type property
            card_click: true,
            section: 'feature_card'
        });

        onClick(feature.id);
    };

    return (
        <div
            key={feature.id}
            className={cn(
                "hover:scale-105 transition-transform duration-300 cursor-pointer",
                "bg-white border-2 border-black rounded-none shadow-brutalist p-4",
            )}
            onClick={handleClick}
        >
            <div className="flex flex-col items-center">
                {feature.img ? (
                    <Image
                        src={feature.img}
                        alt={feature.title}
                        height={isMobile ? 200 : 256}
                        className="object-cover mb-2 sm:mb-4"
                    />
                ) : (
                    <div className="w-full h-[150] sm:h-[256px] bg-gray-200 border border-black mb-2 sm:mb-4"></div>
                )}
                <h3 className={cn(
                    "font-bold text-xl mb-1 text-center pb-1",
                    "sm:text-2xl sm:mb-2 sm:pb-0"
                )}>
                    {feature.title}
                </h3>
                <p className={cn(
                    "text-sm ",
                    "xl:text-lg "
                )}>
                    {feature.description}
                </p>
            </div>
        </div>
    );
}