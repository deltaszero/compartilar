"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Hero from "./landing/components/Hero";
import Features from "./landing/components/Features";
import ConceptSection from "./landing/components/ConceptSection";
import ImageModal from "./landing/components/ImageModal";
import Analytics, { trackEvent, AnalyticsEventType } from "@/app/components/Analytics";

export default function LandingPage() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ src: any; alt: string } | null>(null);

    // Track screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    // Handle CTA clicks with analytics tracking
    const handleLearnMoreClick = () => {
        trackEvent(AnalyticsEventType.CTA_CLICK, {
            button: 'learn_more',
            section: 'hero'
        });
        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGetStartedClick = () => {
        trackEvent(AnalyticsEventType.CTA_CLICK, {
            button: 'get_started',
            section: 'hero'
        });
        router.push("/signup");
    };

    const handleFeatureClick = (featureId: string) => {
        trackEvent(AnalyticsEventType.FEATURE_CLICK, {
            feature_id: featureId,
            section: 'features'
        });
    };

    const openImageModal = (image: any, alt: string) => {
        trackEvent(AnalyticsEventType.SECTION_VIEW, {
            content_type: 'image',
            content_name: alt
        });
        setSelectedImage({ src: image, alt });
        setImageModalOpen(true);
    };

    return (
        <section className="flex flex-col">
            {/* HEADER */}
            <Header />

            {/* HERO */}
            <Hero
                ref={heroRef}
                onLearnMoreClick={handleLearnMoreClick}
                onGetStartedClick={handleGetStartedClick}
                isMobile={isMobile}
            />

            {/* FEATURES SECTION */}
            <Features
                ref={featuresRef}
                onFeatureClick={handleFeatureClick}
                isMobile={isMobile}
            />

            {/* PLANO PARENTAL SCIENTIFIC CONCEPT SECTION */}
            <ConceptSection
                onGetStartedClick={handleGetStartedClick}
                openImageModal={openImageModal}
            />

            {/* FOOTER */}
            <Footer />

            {/* Image Modal */}
            <ImageModal
                open={imageModalOpen}
                onOpenChange={setImageModalOpen}
                selectedImage={selectedImage}
            />
        </section>
    );
}