// /components/ui/LoadingPage.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import tree_animation from "@assets/images/puzzle-piece.gif";

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
                bg-white/80 backdrop-blur-sm transition-all duration-300
            "
            aria-label="Initial Platform Loading"
            role="status"
        >
            <div className="flex flex-col items-center justify-center space-y-4">
                <Image
                    src={tree_animation}
                    alt="Connecting your co-parenting journey"
                    width={250}
                    height={250}
                    priority
                    className="animate-pulse"
                />
            </div>
        </div>
    );
};

export default LoadingPage;