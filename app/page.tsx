"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Hero from "./landing/components/Hero";
import Features from "./landing/components/Features";
// import FeatureScreenshots from "./landing/components/FeatureScreenshots";
import Pricing from "./landing/components/Pricing";
import ConceptSection from "./landing/components/ConceptSection";
import ImageModal from "./landing/components/ImageModal";
import { trackEvent, AnalyticsEventType } from "@/app/components/Analytics";
import { ImageSource } from "@/types/imageTypes";

export default function LandingPage() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null);


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

        // Navigate to the corresponding section
        const sectionElement = document.getElementById(featureId);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: "smooth" });
        } else {
            console.log(`Section with ID ${featureId} not found`);
        }
    };

    const openImageModal = (image: ImageSource) => {
        trackEvent(AnalyticsEventType.SECTION_VIEW, {
            content_type: 'image',
            content_name: image.alt || 'Untitled Image'
        });
        setSelectedImage(image);
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

            {/* PLANO PARENTAL SCIENTIFIC CONCEPT SECTION */}
            <ConceptSection
                onGetStartedClick={handleGetStartedClick}
                openImageModal={openImageModal}
            />

            {/* FEATURES SECTION */}
            <Features
                ref={featuresRef}
                onFeatureClick={handleFeatureClick}
                isMobile={isMobile}
            />

            {/* FEATURE SCREENSHOTS SECTION */}
            {/* <FeatureScreenshots/> */}

            {/* FEATURE SCREENSHOTS SECTION */}
            <Pricing />


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