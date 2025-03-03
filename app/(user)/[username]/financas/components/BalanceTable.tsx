'use client';

import React from 'react';
import { Balance } from './types'; // import { Balance, FinanceUserData } from './types';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserData = {
  uid: string;
  firstName?: string;
  lastName?: string;
  username: string;
  photoURL?: string;
};

interface BalanceTableProps {
  balances: Balance[];
  userData: UserData;
}

export const BalanceTable: React.FC<BalanceTableProps> = ({ balances, userData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldos</CardTitle>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Sem dados para cálculo de saldo
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map(balance => (
                    <TableRow key={balance.uid}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {balance.photoURL && <AvatarImage src={balance.photoURL} alt={balance.name} />}
                          <AvatarFallback>{balance.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{balance.uid === userData.uid ? 'Você' : balance.name}</span>
                      </TableCell>
                      <TableCell 
                        className={
                          balance.balance > 0 
                            ? 'text-emerald-600 dark:text-emerald-500 font-medium' 
                            : balance.balance < 0 
                            ? 'text-red-600 dark:text-red-500 font-medium' 
                            : ''
                        }
                      >
                        R$ {balance.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {balance.balance > 0 ? (
                          <Badge className="bg-green-500 hover:bg-green-600">A receber</Badge>
                        ) : balance.balance < 0 ? (
                          <Badge variant="destructive">A pagar</Badge>
                        ) : (
                          <Badge variant="outline">Neutro</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View - Compact */}
            <div className="md:hidden space-y-2 mt-2">
              {balances.map(balance => (
                <div key={balance.uid} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {balance.photoURL && <AvatarImage src={balance.photoURL} alt={balance.name} />}
                      <AvatarFallback className="text-xs">{balance.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">{balance.uid === userData.uid ? 'Você' : balance.name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div 
                      className={`text-sm font-medium ${
                        balance.balance > 0 
                          ? 'text-emerald-600 dark:text-emerald-500' 
                          : balance.balance < 0 
                          ? 'text-red-600 dark:text-red-500' 
                          : ''
                      }`}
                    >
                      R$ {balance.balance.toFixed(2)}
                    </div>
                    
                    {balance.balance > 0 ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-[10px] h-5 px-1.5">A receber</Badge>
                    ) : balance.balance < 0 ? (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5">A pagar</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">Neutro</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};