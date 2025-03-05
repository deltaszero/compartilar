'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense, Child, Friend } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Users2, Tag, BanknoteIcon, Hash, SplitSquareVertical, User, PieChart } from 'lucide-react';

interface ExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  friends: Friend[];
  children?: { [id: string]: { firstName: string; lastName: string; photoURL?: string } };
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  userData,
  friends,
  children = {}
}) => {
  if (!expense) return null;

  // Format date
  const formatDate = (timestamp: any): string => {
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (_) {
      return 'Data inválida';
    }
  };

  // Helper function to get the name of a user
  const getUserName = (uid: string): string => {
    if (uid === userData.uid) {
      return `Você${userData.firstName ? ` (${userData.firstName})` : ''}`;
    }
    
    const friend = friends.find(f => f.uid === uid);
    return friend ? `${friend.firstName} ${friend.lastName}` : 'Desconhecido';
  };
  
  // Helper function to get the photo URL of a user
  const getUserPhoto = (uid: string): string | undefined => {
    if (uid === userData.uid) {
      return userData.photoURL;
    }
    
    const friend = friends.find(f => f.uid === uid);
    return friend?.photoURL;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {expense.description}
            {expense.childrenIds && expense.childrenIds.length > 0 && (
              <span className="ml-2 align-middle inline-block">
                <Badge variant="default" className="bg-primary/10">
                  <User className="h-3 w-3 mr-1" />
                  Infantil
                </Badge>
              </span>
            )}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(expense.date)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Valor e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                <BanknoteIcon className="h-4 w-4" />
                <span>Valor</span>
              </div>
              <p className="text-lg font-bold">R$ {expense.amount.toFixed(2)}</p>
              
              {/* Status de crianças */}
              {expense.childrenIds && expense.childrenIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Despesa infantil
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Categoria</span>
              </div>
              <p>
                <Badge variant="default" className="font-normal">
                  {expense.category}
                </Badge>
              </p>
            </div>
          </div>
          
          {/* Datas de criação e atualização */}
          <div className="border rounded-lg p-3 bg-background">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Criado em</span>
                </div>
                <p className="text-sm">{formatDate(expense.createdAt)}</p>
              </div>
              
              {expense.updatedAt && expense.createdAt && expense.updatedAt.toMillis() > expense.createdAt.toMillis() && (
                <div>
                  <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Atualizado em</span>
                  </div>
                  <p className="text-sm">{formatDate(expense.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* ID da despesa */}
          <div className="border rounded-lg p-3 bg-background">
            <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>ID da despesa</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{expense.id}</p>
          </div>
          
          {/* Pago por */}
          <div className="border rounded-lg p-3 bg-background">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Users2 className="h-4 w-4" />
              <span>Pago por</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {getUserPhoto(expense.paidBy) && (
                  <AvatarImage src={getUserPhoto(expense.paidBy)} alt="Pago por" />
                )}
                <AvatarFallback>{getUserName(expense.paidBy).charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{getUserName(expense.paidBy)}</span>
            </div>
          </div>
          
          {/* Método de divisão */}
          {expense.members && expense.members.length > 0 && (
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <SplitSquareVertical className="h-4 w-4" />
                <span>Método de divisão</span>
              </div>
              <Badge variant="default" className="capitalize">
                {expense.members[0].splitType === 'equal' ? 'Divisão igual' : 
                  expense.members[0].splitType === 'percentage' ? 'Porcentagem' : 'Valor fixo'}
              </Badge>
              
              {/* Visualização de porcentagens */}
              {expense.members[0].splitType === 'percentage' && expense.members.length > 1 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <PieChart className="h-3 w-3" />
                    <span>Distribuição</span>
                  </div>
                  <div className="relative h-5 w-full rounded-sm overflow-hidden border">
                    {expense.members.map((member, index) => {
                      // Calculate the cumulative percentage up to this member
                      const prevPercentage = expense.members
                        .slice(0, index)
                        .reduce((acc, m) => acc + m.splitValue, 0);
                      
                      // Create a gradient of colors
                      const colors = ['#9333ea', '#4f46e5', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];
                      const colorIndex = index % colors.length;
                      
                      return (
                        <div 
                          key={member.uid} 
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${prevPercentage}%`,
                            width: `${member.splitValue}%`,
                            backgroundColor: colors[colorIndex],
                          }}
                          title={`${member.name}: ${member.splitValue}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Crianças relacionadas */}
          {expense.childrenIds && expense.childrenIds.length > 0 && (
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Crianças relacionadas ({expense.childrenIds.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {expense.childrenIds.map(childId => {
                  const child = children[childId];
                  return (
                    <div key={childId} className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                      <div 
                        className="h-5 w-5 rounded-full relative flex items-center justify-center"
                        style={{ 
                          backgroundColor: child && child.photoURL ? 'transparent' : '#E2E8F0',
                          backgroundImage: child && child.photoURL ? `url(${child.photoURL})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {(!child || !child.photoURL) && (
                          <span className="text-[10px] font-medium text-gray-700">
                            {child ? `${child.firstName[0]}${child.lastName[0]}` : '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm">
                        {child ? `${child.firstName} ${child.lastName}` : `Criança ${childId}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Divisão da despesa */}
          {expense.members && expense.members.length > 0 && (
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Users2 className="h-4 w-4" />
                <span>Divisão da despesa ({expense.members.length} {expense.members.length === 1 ? 'pessoa' : 'pessoas'})</span>
              </div>
              <div className="space-y-2">
                {expense.members.map(member => {
                  let amountOrPercentage = '';
                  
                  if (member.splitType === 'equal') {
                    const equalShare = expense.amount / expense.members.length;
                    amountOrPercentage = `R$ ${equalShare.toFixed(2)}`;
                  } else if (member.splitType === 'percentage') {
                    amountOrPercentage = `${member.splitValue}% (R$ ${(expense.amount * member.splitValue / 100).toFixed(2)})`;
                  } else if (member.splitType === 'fixed') {
                    amountOrPercentage = `R$ ${member.splitValue.toFixed(2)}`;
                  }
                  
                  return (
                    <div key={member.uid} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {member.photoURL && (
                            <AvatarImage src={member.photoURL} alt={member.name} />
                          )}
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                      <span className="text-sm font-medium">{amountOrPercentage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="w-full flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              ID: {expense.id.substring(0, 8)}...
            </div>
            <DialogClose asChild>
              <Button variant="default">Fechar</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};