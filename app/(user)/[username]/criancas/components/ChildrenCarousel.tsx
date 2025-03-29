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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Sparkles } from 'lucide-react';
import { SubscriptionButton } from '@/app/components/logged-area/ui/SubscriptionButton';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

interface ChildrenCarouselProps {
    children: KidInfo[];
    isLoading: boolean;
    isOwnChildren?: boolean;
}

export const ChildrenCarousel = ({ children, isLoading, isOwnChildren = false }: ChildrenCarouselProps) => {
    const { username } = useParams<{ username: string }>();
    const [api, setApi] = useState<any>(null);
    const [current, setCurrent] = useState(0);
    const { isPremium } = usePremiumFeatures();

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
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhuma criança cadastrada</h3>
                <p className="text-sm text-gray-400 mb-4">
                    {isOwnChildren
                        ? "Adicione crianças ao seu perfil para visualizá-las aqui."
                        : "Este usuário não possui crianças cadastradas."}
                </p>
                {isOwnChildren ? (
                    // For first child, direct link is used
                    <Link href={`/${username}/criancas/novo`}>
                        <Button variant="default" className='bg-mainStrongGreen'>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar criança
                        </Button>
                    </Link>
                ) : (
                    <Link href={`/${username}/perfil`}>
                        <Button variant="default">Ir para o Perfil</Button>
                    </Link>
                )}
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

    // Filter out any deleted children just to be extra safe
    const visibleChildren = children.filter(child => !child.isDeleted);
    
    // If there are no visible children after filtering, show empty state
    if (visibleChildren.length === 0 && !isLoading) {
        return (
            <div className="w-full h-[300px] rounded-xl bg-muted/30 border-2 border-border flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhuma criança cadastrada</h3>
                <p className="text-sm text-gray-400 mb-4">
                    {isOwnChildren
                        ? "Adicione crianças ao seu perfil para visualizá-las aqui."
                        : "Este usuário não possui crianças cadastradas."}
                </p>
                {isOwnChildren ? (
                    // For first child, direct link is used  
                    <Link href={`/${username}/criancas/novo`}>
                        <Button variant="default" className='bg-mainStrongGreen px-4 text-md font-semibold font-raleway'>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar criança
                        </Button>
                    </Link>
                ) : (
                    <Link href={`/${username}/perfil`}>
                        <Button variant="default">Ir para o Perfil</Button>
                    </Link>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-4">
            {/* Add Child Button - shown above carousel when user has children and it's their own profile */}
            {isOwnChildren && visibleChildren.length > 0 && (
                <div className="flex justify-end mb-2">
                    {isPremium ? (
                        // Premium users get direct link to add more children
                        <Link href={`/${username}/criancas/novo`}>
                            <Button variant="default" size="sm" className='bg-mainStrongGreen px-4 text-md font-semibold font-raleway'>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Criança
                            </Button>
                        </Link>
                    ) : (
                        // Free users see premium upgrade dialog
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className='bg-mainStrongGreen px-4 text-md font-semibold font-raleway'>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Criança
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md p-6">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center">
                                        <Sparkles className="w-8 h-8 mr-2 text-main" />
                                        <p className='text-2xl font-bold font-raleway py-2'>
                                            Recurso Premium
                                        </p>
                                    </DialogTitle>
                                    <DialogDescription>
                                        <div className='flex flex-col gap-2 text-lg font-nunito'>
                                            <p>
                                                Usuários grátis podem adicionar apenas 1 criança ao perfil.
                                            </p>
                                            <p>
                                                Faça upgrade para adicionar mais crianças e desbloquear recursos adicionais.
                                            </p>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-6 flex flex-col space-y-3">
                                    <SubscriptionButton />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            )}

            <div className="w-full rounded-xl overflow-hidden border-2 border-border">
                <Carousel className="w-full" setApi={setApi} opts={{ loop: visibleChildren.length > 1 }}>
                    <CarouselContent>
                        {visibleChildren.map((child) => (
                            <CarouselItem key={child.id}>
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardContent className="p-0">
                                        {/* Full-width photo with overlay content */}
                                        <div className="relative w-full h-[360px] sm:h-[500px]">
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
                                                        <h2 className="text-2xl font-bold drop-shadow-md font-raleway">
                                                            {child.firstName} {child.lastName}
                                                        </h2>
                                                        <Badge className='my-1 rounded-xl bg-blank text-bw text-sm' variant="default" >
                                                            {calculateAge(child.birthDate)}
                                                        </Badge>
                                                    </div>

                                                    <Link href={`/${username}/criancas/${child.id}`}>
                                                        <Button variant="default" size="sm" className="px-4 text-md font-semibold font-raleway">
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

                    {visibleChildren.length > 1 && (
                        <>
                            <CarouselPrevious className="left-4 bg-bw hover:bg-background" />
                            <CarouselNext className="right-4 bg-bw hover:bg-background" />

                            {/* Dots indicator */}
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                {visibleChildren.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => api?.scrollTo(index)}
                                        className={`w-2 h-2 rounded-full transition-colors ${index === current ? 'bg-main' : 'bg-white/70 hover:bg-white'
                                            }`}
                                        aria-label={`Ir para criança ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </Carousel>
            </div>
        </div>
    );
};

export default ChildrenCarousel;