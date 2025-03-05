'use client';

import React from 'react';
import { ExpenseMember, Friend, SplitMethod, Child } from './types';
import { EXPENSE_CATEGORIES } from './constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Plus, Receipt, ArrowRight, X, User } from "lucide-react";

export type UserData = {
  uid: string;
  firstName?: string;
  lastName?: string;
  username: string;
  photoURL?: string;
};

interface CostGroup {
  id: string;
  members: string[];
}

interface ExpenseFormProps {
  isAddingExpense: boolean;
  setIsAddingExpense: (value: boolean) => void;
  selectedPeriod: '7d' | '30d' | '90d' | 'all';
  setSelectedPeriod: (value: '7d' | '30d' | '90d' | 'all') => void;
  userData: UserData;
  friends: Friend[];
  children: Child[];
  selectedGroup: string;
  costGroups: CostGroup[];
  expenseMembers: ExpenseMember[];
  newExpenseDescription: string;
  setNewExpenseDescription: (value: string) => void;
  newExpenseAmount: string;
  setNewExpenseAmount: (value: string) => void;
  newExpensePaidBy: string;
  setNewExpensePaidBy: (value: string) => void;
  newExpenseCategory: string;
  setNewExpenseCategory: (value: string) => void;
  newExpenseDate: string;
  setNewExpenseDate: (value: string) => void;
  splitMethod: SplitMethod;
  setSplitMethod: (value: SplitMethod) => void;
  updateMemberSplit: (uid: string, value: number) => void;
  selectedChildrenIds: string[];
  setSelectedChildrenIds: (childrenIds: string[]) => void;
  handleCreateExpense: (e: React.FormEvent) => void;
  isEditing?: boolean;
  resetSplitPercentages: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isAddingExpense,
  setIsAddingExpense,
  selectedPeriod,
  setSelectedPeriod,
  userData,
  friends,
  children = [], // Add default empty array
  selectedGroup,
  costGroups,
  expenseMembers,
  newExpenseDescription,
  setNewExpenseDescription,
  newExpenseAmount,
  setNewExpenseAmount,
  newExpensePaidBy,
  setNewExpensePaidBy,
  newExpenseCategory,
  setNewExpenseCategory,
  newExpenseDate,
  setNewExpenseDate,
  splitMethod,
  setSplitMethod,
  updateMemberSplit,
  selectedChildrenIds,
  setSelectedChildrenIds,
  handleCreateExpense,
  isEditing = false,
  resetSplitPercentages,
}) => {
  const onOpenChange = (open: boolean) => {
    setIsAddingExpense(open);
    if (!open) {
      // Reset form when closing
      setNewExpenseDescription('');
      setNewExpenseAmount('');
      setNewExpenseCategory('');
      setNewExpenseDate(new Date().toISOString().split('T')[0]);
      setSelectedChildrenIds([]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <Select
            value={selectedPeriod}
            onValueChange={(value: string) => setSelectedPeriod(value as '7d' | '30d' | '90d' | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddingExpense} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto pb-10 mb-14 sm:mb-0 sm:pb-6 top-[45%] sm:top-[50%]">
            <DialogHeader className="flex flex-row items-center justify-between pr-0">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
              </DialogTitle>
              <DialogClose className="p-1.5 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </DialogClose>
            </DialogHeader>
            
            <form onSubmit={handleCreateExpense} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Descrição</Label>
                  <Input 
                    id="expense-description"
                    type="text" 
                    value={newExpenseDescription}
                    onChange={e => setNewExpenseDescription(e.target.value)}
                    placeholder="Ex: Supermercado, Aluguel, etc."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Valor (R$)</Label>
                  <Input 
                    id="expense-amount"
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={newExpenseAmount}
                    onChange={e => setNewExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-paid-by">Pago por</Label>
                  <Select
                    value={newExpensePaidBy}
                    onValueChange={setNewExpensePaidBy}
                  >
                    <SelectTrigger id="expense-paid-by">
                      <SelectValue placeholder="Selecione quem pagou" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={userData.uid}>
                        Você ({userData.firstName})
                      </SelectItem>
                      {friends.map(friend => {
                        const group = costGroups.find(g => g.id === selectedGroup);
                        if (group && group.members.includes(friend.uid)) {
                          return (
                            <SelectItem key={friend.uid} value={friend.uid}>
                              {`${friend.firstName} ${friend.lastName}`}
                            </SelectItem>
                          );
                        }
                        return null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoria</Label>
                  <Select
                    value={newExpenseCategory}
                    onValueChange={setNewExpenseCategory}
                  >
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Data</Label>
                  <Input 
                    id="expense-date"
                    type="date" 
                    value={newExpenseDate}
                    onChange={e => setNewExpenseDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-split-method">Método de Divisão</Label>
                  <Select
                    value={splitMethod}
                    onValueChange={(value) => setSplitMethod(value as SplitMethod)}
                  >
                    <SelectTrigger id="expense-split-method">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Igual para todos</SelectItem>
                      <SelectItem value="percentage">Porcentagens</SelectItem>
                      <SelectItem value="fixed">Valores Fixos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Children section */}
              {children.length > 0 && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <h3 className="text-base font-medium mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Despesa relacionada às crianças
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                          <Checkbox 
                            id={`child-${child.id}`}
                            checked={selectedChildrenIds.includes(child.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedChildrenIds([...selectedChildrenIds, child.id]);
                              } else {
                                setSelectedChildrenIds(selectedChildrenIds.filter(id => id !== child.id));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`child-${child.id}`}
                            className="flex items-center flex-1 cursor-pointer"
                          >
                            {child.photoURL && (
                              <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                                <img 
                                  src={child.photoURL} 
                                  alt={`${child.firstName}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            {`${child.firstName} ${child.lastName}`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <h3 className="text-base font-medium mb-3 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Divisão de Despesas
                  </h3>
                  
                  <div className="space-y-2 max-h-[25vh] sm:max-h-none overflow-y-auto pr-1">
                    {expenseMembers.map(member => (
                      <div key={member.uid} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0 truncate">
                          {member.uid === userData.uid ? 'Você' : member.name}
                        </div>
                        
                        {splitMethod === 'equal' ? (
                          <Badge variant="default">
                            {(100 / expenseMembers.length).toFixed(0)}%
                          </Badge>
                        ) : splitMethod === 'percentage' ? (
                          <div className="flex items-center space-x-2 shrink-0">
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              className="w-16 sm:w-20"
                              value={member.splitValue}
                              onChange={e => updateMemberSplit(
                                member.uid, 
                                parseFloat(e.target.value) || 0
                              )}
                            />
                            <span>%</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 shrink-0">
                            <span>R$</span>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-16 sm:w-20"
                              value={member.splitValue}
                              onChange={e => updateMemberSplit(
                                member.uid, 
                                parseFloat(e.target.value) || 0
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <DialogFooter className="mt-6 flex-col sm:flex-row gap-3 sm:gap-2 sticky bottom-0 pt-2 bg-background">
                <DialogClose asChild className="block sm:hidden w-full">
                  <Button type="button" variant="default" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                </DialogClose>
                <DialogClose asChild className="hidden sm:block">
                  <Button type="button" variant="default">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                  {isEditing ? (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Atualizar Despesa
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Despesa
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};