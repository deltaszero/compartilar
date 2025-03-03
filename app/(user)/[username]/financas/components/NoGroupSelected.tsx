'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface CostGroup {
  id: string;
  name: string;
}

interface NoGroupSelectedProps {
  costGroups: CostGroup[];
}

export const NoGroupSelected: React.FC<NoGroupSelectedProps> = ({ costGroups }) => {
  const hasGroups = costGroups.length > 0;
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col items-center justify-center h-full py-12">
        <h2 className="text-xl font-semibold text-center">
          Selecione um grupo para ver as despesas
        </h2>
        <p className="text-center text-muted-foreground mt-2">
          {hasGroups
            ? 'Ou crie um novo grupo para começar a registrar despesas'
            : 'Comece criando um grupo de despesas'}
        </p>
      </CardContent>
    </Card>
  );
};