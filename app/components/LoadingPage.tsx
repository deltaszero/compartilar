// /components/ui/LoadingPage.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import puzzle_piece from "@assets/animations/puzzle-piece-purple-2.gif";

const LoadingPage: React.FC = () => {
    const [, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener('resize', checkMobileScreen);
        return () => window.removeEventListener('resize', checkMobileScreen);
    }, []);

    // if (!isMobile) return null;

    return (
        <div
            className="
                fixed inset-0 z-[9999] flex items-center justify-center 
                bg-bg backdrop-blur-sm transition-all duration-300
            "
            aria-label="Initial Platform Loading"
            role="status"
        >
            <div className="flex flex-col items-center justify-center space-y-4">
                <Image
                    src={puzzle_piece}
                    alt="Connecting your co-parenting journey"
                    width={250}
                    height={250}
                    // Remove priority to prevent unused preload warning
                    // priority
                    className="animate-pulse"
                />
            </div>
        </div>
    );
};

export default LoadingPage;