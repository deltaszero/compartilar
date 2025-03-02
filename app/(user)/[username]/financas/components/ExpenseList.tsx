'use client';

import React from 'react';
import { Expense, Friend, FinanceUserData } from './types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, Calendar, User } from "lucide-react";


interface ExpenseListProps {
  userData: any;
  friends: Friend[];
  isLoadingExpenses: boolean;
  filteredExpenses: Expense[];
  handleDeleteExpense: (id: string) => Promise<void>;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  userData,
  friends,
  isLoadingExpenses,
  filteredExpenses,
  handleDeleteExpense
}) => {
  const sortedExpenses = filteredExpenses.sort((a, b) => 
    b.date.toDate().getTime() - a.date.toDate().getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Lista de Despesas</CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoadingExpenses ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma despesa registrada no período selecionado
              </div>
            ) : (
              <>
                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Pago por</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedExpenses.map(expense => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date.toDate().toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {expense.paidBy === userData.uid 
                              ? 'Você' 
                              : friends.find(f => f.uid === expense.paidBy)?.firstName || 'Desconhecido'}
                          </TableCell>
                          <TableCell className="font-semibold">R$ {expense.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View - Compact List */}
                <div className="md:hidden space-y-2">
                  {sortedExpenses.map(expense => (
                    <div key={expense.id} className="bg-card border rounded-md p-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-sm truncate">{expense.description}</div>
                            <div className="font-semibold text-sm whitespace-nowrap ml-1">
                              R$ {expense.amount.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {expense.date.toDate().toLocaleDateString()}
                            </span>
                            
                            <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                              {expense.category}
                            </Badge>
                            
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {expense.paidBy === userData.uid 
                                ? 'Você' 
                                : friends.find(f => f.uid === expense.paidBy)?.firstName || 'Outro'}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 ml-1 shrink-0"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};