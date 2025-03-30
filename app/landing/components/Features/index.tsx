import { forwardRef, useEffect } from "react";
import SectionTitle from "../SectionTitle";
import { features } from "./data";
import FeatureCard from "./FeatureCard";
import { trackEvent, AnalyticsEventType } from "@/app/components/Analytics";

interface FeaturesProps {
    onFeatureClick: (id: string) => void;
    isMobile: boolean;
}

const Features = forwardRef<HTMLDivElement, FeaturesProps>(
    ({ onFeatureClick, isMobile }, ref) => {
        // Track features section view using Intersection Observer
        useEffect(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            trackEvent(AnalyticsEventType.SECTION_VIEW, {
                                section_name: 'features',
                                section_position: 'middle',
                                is_visible: true,
                                device_type: isMobile ? 'mobile' : 'desktop',
                                feature_count: features.length
                            });
                            
                            // Track engagement
                            trackEvent(AnalyticsEventType.LANDING_FEATURE_ENGAGEMENT, {
                                engagement_type: 'section_view',
                                device_type: isMobile ? 'mobile' : 'desktop',
                                feature_categories: features.map(f => f.id).join(',')
                            });
                            
                            // Once tracked, disconnect observer
                            observer.disconnect();
                        }
                    });
                },
                { threshold: 0.2 } // Track when 20% of the features section is visible
            );
            
            // Get the element to observe
            if (ref && typeof ref !== 'function' && ref.current) {
                observer.observe(ref.current);
            }
            
            return () => observer.disconnect();
        }, [isMobile, ref]);
        
        // Enhanced tracking wrapper for the feature click
        const handleFeatureClick = (featureId: string) => {
            // Find the feature to get its title
            const feature = features.find(f => f.id === featureId);
            
            trackEvent(AnalyticsEventType.LANDING_FEATURE_ENGAGEMENT, {
                engagement_type: 'feature_click',
                feature_id: featureId,
                feature_name: feature?.title || 'Unknown Feature',
                device_type: isMobile ? 'mobile' : 'desktop'
            });
            
            // Call the original click handler
            onFeatureClick(featureId);
        };
        
        return (
            <section className="bg-main" id="features">
                <div ref={ref}>
                    <SectionTitle title="Soluções que transformam a coparentalidade" />
                </div>
                <div className="px-4 pb-12 mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-8">
                        {features.map((feature) => (
                            <FeatureCard
                                key={feature.id}
                                feature={feature}
                                onClick={handleFeatureClick}
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }
);

Features.displayName = "Features";

export default Features;