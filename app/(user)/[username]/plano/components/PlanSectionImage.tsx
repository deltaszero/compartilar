import React from 'react';
import Image from 'next/image';

// Import all images
import educationImage from '@/app/assets/images/plan_02.webp';
import extracurricularImage from '@/app/assets/images/plan_03.webp';
import extrasImage from '@/app/assets/images/plan_04.webp';
import screensImage from '@/app/assets/images/plan_05.webp';
import religionImage from '@/app/assets/images/plan_06.webp';
import travelImage from '@/app/assets/images/plan_07.webp';
import healthImage from '@/app/assets/images/plan_08.webp';
import supportImage from '@/app/assets/images/plan_09.webp';
import coexistenceImage from '@/app/assets/images/plan_10.webp';
import consequencesImage from '@/app/assets/images/plan_11.webp';
import defaultImage from '@/app/assets/images/horizontal-menu_tasklist.webp';

// Map section IDs to imported images
const imageMap: Record<string, any> = {
    education: educationImage,
    extracurricular: extracurricularImage,
    extras: extrasImage,
    screens: screensImage,
    religion: religionImage,
    travel: travelImage,
    health: healthImage,
    support: supportImage,
    coexistence: coexistenceImage,
    consequences: consequencesImage
};

interface PlanSectionImageProps {
    sectionId: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

export default function PlanSectionImage({
    sectionId,
    alt,
    width = 40,
    height = 40,
    className = ""
}: PlanSectionImageProps) {
    // Get the image for this section or use default if not found
    const imageSource = imageMap[sectionId] || defaultImage;

    return (
        <Image
            src={imageSource}
            alt={alt}
            width={width}
            height={height}
            className={className}
        />
    );
}