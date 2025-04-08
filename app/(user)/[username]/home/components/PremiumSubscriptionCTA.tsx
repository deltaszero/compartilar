'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Sparkles } from 'lucide-react';
import { SubscriptionButton } from '@/app/components/logged-area/ui/SubscriptionButton';
import Image from 'next/image';

export const PremiumSubscriptionCTA = () => {
    const { isPremium } = usePremiumFeatures();

    // Don't render anything if user is already premium
    if (isPremium) {
        return null;
    }

    return (
        <div className="p-4 mt-4">
            <Card className="border-2 border-black shadow-brutalist overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 relative">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                    <Image
                        src="/assets/images/premium.webp"
                        alt="Premium"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg font-bold">
                        <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                        Faça upgrade para o plano Premium
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm mb-2">
                            Desbloqueie todos os recursos do CompartiLar:
                        </p>
                        <ul className="text-sm ml-6 list-disc space-y-1">
                            <li>Perfis ilimitados para seus filhos</li>
                            <li>Eventos ilimitados no calendário</li>
                            <li>Despesas ilimitadas no painel financeiro</li>
                            <li>Histórico completo de check-in</li>
                            <li>Até 5 membros na rede de apoio</li>
                        </ul>
                    </div>
                    <SubscriptionButton />
                </CardContent>
            </Card>
        </div>
    );
};