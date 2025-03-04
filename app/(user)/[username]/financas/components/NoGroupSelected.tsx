'use client';

import React from 'react';
import { CostGroup } from './types';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface NoGroupSelectedProps {
  costGroups: CostGroup[];
}

export const NoGroupSelected: React.FC<NoGroupSelectedProps> = ({ costGroups }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <ArrowLeft className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione um grupo</h2>
        <p className="text-muted-foreground max-w-md">
          {costGroups.length > 0 
            ? 'Selecione um grupo de despesas à esquerda para visualizar e gerenciar suas despesas.'
            : 'Você ainda não tem grupos de despesas. Crie um novo grupo para começar a registrar suas despesas.'}
        </p>
      </CardContent>
    </Card>
  );
};