'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Plus, Calendar, Gift, Star } from 'lucide-react';
import { KidInfo } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChildrenGridProps {
  children: KidInfo[];
  isLoading: boolean;
  isOwnChildren: boolean;
}

export const ChildrenGrid = ({ children, isLoading, isOwnChildren }: ChildrenGridProps) => {
  const { username } = useParams<{ username: string }>();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  function formatBirthdate(birthDateStr: string) {
    try {
      const date = new Date(birthDateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return 'Data indisponível';
    }
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
  
  function getGenderText(gender: string | null) {
    if (!gender) return "";
    
    switch (gender) {
      case "male": return "Menino";
      case "female": return "Menina";
      case "other": return "Outro";
      default: return "";
    }
  }
  
  function getRelationshipText(relationship: string | null) {
    if (!relationship) return "Relação não especificada";
    
    switch (relationship) {
      case "biological": return "Filho(a) Biológico(a)";
      case "adopted": return "Filho(a) Adotivo(a)";
      case "guardian": return "Sob Guarda";
      default: return "Relação não especificada";
    }
  }
  
  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Informações detalhadas</h2>
        {isOwnChildren && (
          <Link href={`/${username}/criancas/novo`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar criança
            </Button>
          </Link>
        )}
      </div>
      
      {/* Empty state */}
      {children.length === 0 && (
        <div className="bg-muted/30 rounded-xl border border-border p-8 text-center">
          <h3 className="text-xl font-medium mb-2">Nenhuma criança cadastrada</h3>
          <p className="text-muted-foreground mb-6">
            {isOwnChildren 
              ? "Adicione crianças ao seu perfil para visualizá-las aqui."
              : "Este usuário não possui crianças cadastradas."}
          </p>
          {isOwnChildren && (
            <Link href={`/${username}/criancas/novo`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar criança
              </Button>
            </Link>
          )}
        </div>
      )}
      
      {/* Children grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/10 border-b sm:border-b-0 sm:border-r border-border">
                {child.photoURL ? (
                  <Image
                    src={child.photoURL}
                    alt={`Foto de ${child.firstName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-primary/50">
                      {child.firstName[0].toUpperCase()}
                      {child.lastName[0].toUpperCase()}
                    </span>
                  </div>
                )}
                
                {child.gender && (
                  <Badge 
                    variant="outline" 
                    className="absolute top-2 right-2 bg-background/80"
                  >
                    {getGenderText(child.gender)}
                  </Badge>
                )}
              </div>
              
              <CardContent className="flex-1 p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{child.firstName} {child.lastName}</h3>
                  <p className="text-muted-foreground text-sm">{getRelationshipText(child.relationship)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Nascimento: {formatBirthdate(child.birthDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Gift className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Idade: {calculateAge(child.birthDate)}</span>
                  </div>
                </div>
              </CardContent>
            </div>
            
            <CardFooter className="border-t border-border p-4 bg-muted/10">
              <Link href={`/${username}/criancas/${child.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  {isOwnChildren ? "Editar informações" : "Ver detalhes"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChildrenGrid;