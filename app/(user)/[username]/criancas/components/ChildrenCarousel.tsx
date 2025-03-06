'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { KidInfo } from '../types';
import { Button } from '@/components/ui/button';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChildrenCarouselProps {
  children: KidInfo[];
  isLoading: boolean;
}

export const ChildrenCarousel = ({ children, isLoading }: ChildrenCarouselProps) => {
  const { username } = useParams<{ username: string }>();
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Empty state if no children
  if (!isLoading && children.length === 0) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-muted/30 border-2 border-border flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">Nenhuma criança cadastrada</h3>
        <p className="text-sm text-muted-foreground mb-4">Adicione crianças ao seu perfil para visualizá-las aqui.</p>
        <Link href={`/${username}/perfil`}>
          <Button variant="default">Ir para o Perfil</Button>
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-muted/30 border-2 border-border flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  function calculateAge(birthDateStr: string) {
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      
      let years = today.getFullYear() - birthDate.getFullYear();
      const months = today.getMonth() - birthDate.getMonth();
      
      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }
      
      if (years < 1) {
        // Calculate months for babies
        const monthAge = months + (months < 0 ? 12 : 0);
        return `${monthAge} ${monthAge === 1 ? 'mês' : 'meses'}`;
      }
      
      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    } catch (e) {
      return "Idade não disponível";
    }
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-border">
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {children.map((child) => (
            <CarouselItem key={child.id}>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                  {/* Full-width photo with overlay content */}
                  <div className="relative w-full h-[300px] sm:h-[500px]">
                    {/* Background image or gradient */}
                    {child.photoURL ? (
                      <Image
                        src={child.photoURL}
                        alt={`Foto de ${child.firstName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <span className="text-8xl font-bold text-primary/60">
                          {child.firstName[0].toUpperCase()}
                          {child.lastName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Dark gradient overlay for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex justify-between items-end">
                        <div>
                          <h2 className="text-2xl font-bold drop-shadow-md">
                            {child.firstName} {child.lastName}
                          </h2>
                          <Badge variant="default" className="mt-1">
                            {calculateAge(child.birthDate)}
                          </Badge>
                        </div>
                        
                        <Link href={`/${username}/criancas/${child.id}`}>
                          <Button variant="default" size="sm" className="shadow-md">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {children.length > 1 && (
          <>
            <CarouselPrevious className="left-4 bg-bw hover:bg-background" />
            <CarouselNext className="right-4 bg-bw hover:bg-background" />
            
            {/* Dots indicator */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {children.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === current ? 'bg-main' : 'bg-white/70 hover:bg-white'
                  }`}
                  aria-label={`Ir para criança ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default ChildrenCarousel;