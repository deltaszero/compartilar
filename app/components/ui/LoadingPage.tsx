// /components/ui/LoadingPage.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
// import { useUser } from '@/context/userContext';
import tree_animation from "@assets/images/tree-animation.gif";

const LoadingPage: React.FC = () => {
//   const { loading, isInitialLoad, setIsInitialLoad } = useUser();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobileScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobileScreen();
    window.addEventListener('resize', checkMobileScreen);
    return () => window.removeEventListener('resize', checkMobileScreen);
  }, []);

//   useEffect(() => {
//     if (!loading && isInitialLoad) {
//       const timer = setTimeout(() => {
//         setIsInitialLoad(false);
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [loading, isInitialLoad, setIsInitialLoad]);

  // Render only on mobile and during initial load
//   if (!isInitialLoad || !isMobile) return null;
    if (!isMobile) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center 
                 bg-white/80 backdrop-blur-sm transition-all duration-300"
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
        <p className="text-sm text-gray-600 animate-pulse">
          Connecting your co-parenting journey...
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;