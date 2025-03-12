'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import puzzlePiece from '@/app/assets/animations/puzzle-piece.gif';

export default function SignupPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  // Redirect to login page with a small delay for animation
  useEffect(() => {
    const duration = 1000; // 3 seconds delay
    const interval = 30; // Update progress every 30ms
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    
    const timer = setInterval(() => {
      currentProgress += increment;
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(timer);
        router.push('/login');
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-4">
      <div className={cn(
        "max-w-md w-full bg-white border-2 border-black rounded-none p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
        "text-center space-y-6"
      )}>
        <div className="flex justify-center">
          <Image
            src={puzzlePiece}
            alt="Puzzle Piece Animation"
            width={120}
            height={120}
            className="animate-pulse"
          />
        </div>

        <h1 className="text-2xl font-bold">Redirecionando...</h1>
        
        {/* <p className="text-lg text-gray-400">
          Nosso cadastro acontece diretamente na página de login, onde você pode criar sua conta 
          ou acessar com o Google. Redirecionando você em instantes...
        </p> */}
        
        <Progress 
          value={progress} 
          className="h-2 border-0"
        />
        
        {/* <Button 
          variant="default" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Ir para o login agora</span>
        </Button> */}
      </div>
    </div>
  );
}