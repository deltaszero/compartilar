'use client';

import React from 'react';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORIES } from "../../financas/components/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BanknoteIcon, PieChartIcon, ArrowRightIcon, BarChart2Icon, User } from 'lucide-react';

interface HomeFinanceAnalyticsProps {
  expenses: any[];
  children?: any[];
  username: string;
  isLoading: boolean;
}

export const HomeFinanceAnalytics: React.FC<HomeFinanceAnalyticsProps> = ({ 
  expenses, 
  children = [],
  username,
  isLoading
}) => {
  // Check if we have data to display
  const hasExpenses = expenses && expenses.length > 0;
  const hasChildExpenses = hasExpenses && expenses.some(e => e.childrenIds && e.childrenIds.length > 0);
  
  // Prepare chart data - expenses by category
  const categoryExpenses = EXPENSE_CATEGORIES.map(category => {
    const total = hasExpenses 
      ? expenses
          .filter(expense => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0)
      : 0;
    return { name: category, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
                 '#FF9F40', '#22CFCF', '#FF6B6B', '#7C7CFF'];
  
  // Prepare chart data - expenses by children
  const childrenMap = children && children.length > 0 
    ? new Map(children.map(child => [child.id, `${child.firstName} ${child.lastName}`]))
    : new Map();
  
  const childExpenses = Array.from(childrenMap.entries()).map(([childId, childName]) => {
    const total = hasExpenses
      ? expenses
          .filter(expense => expense.childrenIds?.includes(childId))
          .reduce((sum, expense) => sum + expense.amount, 0)
      : 0;
    return { name: childName, value: total };
  }).filter(item => item.value > 0);
  
  // Sort child expenses by value (descending)
  childExpenses.sort((a, b) => b.value - a.value);

  // Calculate total expense amount
  const totalAmount = hasExpenses 
    ? expenses.reduce((sum, expense) => sum + expense.amount, 0)
    : 0;

  // Calculate total child-related expenses
  const totalChildExpenses = hasExpenses
    ? expenses
        .filter(expense => expense.childrenIds && expense.childrenIds.length > 0)
        .reduce((sum, expense) => sum + expense.amount, 0)
    : 0;

  // Create reusable card components for the 3-column layout
  const TotalExpenseCard = () => (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-mainStrongBlue border-b-4 border-black">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg uppercase font-extrabold tracking-tight">Despesas</CardTitle>
          <BanknoteIcon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-3xl font-black">R$ {totalAmount.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
      </CardContent>
    </Card>
  );

  const ChildExpenseCard = () => (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-yellow-300 border-b-4 border-black">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg uppercase font-extrabold tracking-tight">Despesas Infantis</CardTitle>
          <User className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-3xl font-black">R$ {totalChildExpenses.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
          {totalAmount > 0 ? `${Math.round((totalChildExpenses / totalAmount) * 100)}% do total` : '0% do total'}
        </p>
      </CardContent>
    </Card>
  );

  const CategoryPieChartCard = () => (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-blue-300 border-b-4 border-black">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg uppercase font-extrabold tracking-tight">Por Categoria</CardTitle>
          <PieChartIcon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {categoryExpenses.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={true}
                  strokeWidth={2}
                  stroke="#000000"
                >
                  {categoryExpenses.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#000000" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="border-4 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                          <p className="font-bold">{payload[0].name}</p>
                          <p className="font-mono">R$ {Number(payload[0].value).toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={20} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground text-center">Sem dados disponíveis</p>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href={`/${username}/financas`}>
            <Button size="sm" variant="outline" className="w-full gap-1 border-2 border-black">
              Ver detalhes <ArrowRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const ChildExpensesChartCard = () => (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] col-span-3 md:col-span-1">
      <CardHeader className="bg-pink-300 border-b-4 border-black">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg uppercase font-extrabold tracking-tight">Por Criança</CardTitle>
          <BarChart2Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {hasChildExpenses && childExpenses.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={childExpenses}
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#000000" strokeWidth={1} />
                <XAxis type="number" stroke="#000000" strokeWidth={2} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} stroke="#000000" strokeWidth={2} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="border-4 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                          <p className="font-bold">{payload[0].payload.name}</p>
                          <p className="font-mono">R$ {Number(payload[0].value).toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" name="Valor Gasto" fill="#FF6384" stroke="#000000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground text-center">Sem despesas infantis</p>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href={`/${username}/financas`}>
            <Button size="sm" variant="outline" className="w-full gap-1 border-2 border-black">
              Ver detalhes <ArrowRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    // Loading state - show skeleton cards in 3-column layout
    return (
      <>
        <div className="col-span-3 md:col-span-1">
          <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-mainStrongBlue border-b-4 border-black">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 md:col-span-1">
          <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-yellow-300 border-b-4 border-black">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 md:col-span-1">
          <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
            <CardHeader className="bg-blue-300 border-b-4 border-black">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-8 w-full mt-4" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!hasExpenses) {
    // No expenses state - show empty state card that spans 3 columns
    return (
      <div className="col-span-3">
        <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
          <CardHeader className="bg-mainStrongBlue border-b-4 border-black">
            <CardTitle className="uppercase font-extrabold tracking-wide">RESUMO FINANCEIRO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 text-center">
              <BanknoteIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">Sem despesas registradas</h3>
              <p className="text-muted-foreground mb-6">
                Comece a registrar suas despesas para visualizar gráficos e análises aqui.
              </p>
              <Link href={`/${username}/financas`}>
                <Button className="gap-2 bg-mainStrongBlue">
                  Ir para Finanças
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full content state - show all cards in 3-column layout
  return (
    <>
      <div className="col-span-3 md:col-span-1">
        <TotalExpenseCard />
      </div>
      <div className="col-span-3 md:col-span-1">
        <ChildExpenseCard />
      </div>
      <div className="col-span-3 md:col-span-1">
        <CategoryPieChartCard />
      </div>
      {hasChildExpenses && childExpenses.length > 0 && (
        <div className="col-span-3 mt-4">
          <ChildExpensesChartCard />
        </div>
      )}
    </>
  );
};