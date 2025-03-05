'use client';

import React from 'react';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORIES } from "../../financas/components/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PieChartIcon, ArrowRightIcon, BarChart2Icon } from 'lucide-react';// import { BanknoteIcon, PieChartIcon, ArrowRightIcon, BarChart2Icon, User } from 'lucide-react';

import { Expense, Child } from "../../financas/components/types";

interface HomeFinanceAnalyticsProps {
  expenses: Expense[];
  childrenData?: Child[];
  username: string;
  isLoading: boolean;
}

export const HomeFinanceAnalytics: React.FC<HomeFinanceAnalyticsProps> = ({ 
  expenses, 
  childrenData = [],
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
  const childrenMap = childrenData && childrenData.length > 0 
    ? new Map(childrenData.map(child => [child.id, `${child.firstName} ${child.lastName}`]))
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

  // Prepare chart data - expenses by date
  const dateExpenses: Record<string, number> = {};
  
  if (hasExpenses) {
    expenses.forEach(expense => {
      try {
        const date = expense.date.toDate().toISOString().slice(0, 10);
        dateExpenses[date] = (dateExpenses[date] || 0) + expense.amount;
      } catch (e) {
        console.log(e);
        console.error("Invalid date in expense:", expense.id);
      }
    });
  }
  
  const sortedDates = Object.keys(dateExpenses).sort();
  
  const dateBarChartData = sortedDates.map(date => {
    const [_year, month, day] = date.split('-');
    console.log(_year);
    return {
      date: `${day}/${month}`,
      amount: dateExpenses[date]
    };
  }).slice(-7); // Show only the last 7 days with data
  
  // // Calculate total expense amount
  // const totalAmount = hasExpenses 
  //   ? expenses.reduce((sum, expense) => sum + expense.amount, 0)
  //   : 0;

  // // Calculate total child-related expenses
  // const totalChildExpenses = hasExpenses
  //   ? expenses
  //       .filter(expense => expense.childrenIds && expense.childrenIds.length > 0)
  //       .reduce((sum, expense) => sum + expense.amount, 0)
  //   : 0;

  // // Create reusable card components for the 3-column layout
  // const TotalExpenseCard = () => (
  //   <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
  //     <div className="flex justify-between items-center mb-2">
  //       <h3 className="text-lg font-bold">Despesas</h3>
  //       <BanknoteIcon className="h-5 w-5" />
  //     </div>
  //     <p className="text-3xl font-black">R$ {totalAmount.toFixed(2)}</p>
  //     <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
  //   </div>
  // );

  // const ChildExpenseCard = () => (
  //   <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
  //     <div className="flex justify-between items-center mb-2">
  //       <h3 className="text-lg font-bold">Despesas Infantis</h3>
  //       <User className="h-5 w-5" />
  //     </div>
  //     <p className="text-3xl font-black">R$ {totalChildExpenses.toFixed(2)}</p>
  //     <p className="text-sm text-muted-foreground">
  //       {totalAmount > 0 ? `${Math.round((totalChildExpenses / totalAmount) * 100)}% do total` : '0% do total'}
  //     </p>
  //   </div>
  // );

  const CategoryPieChartCard = () => (
    <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Gasto por Categoria</h3>
        <PieChartIcon className="h-5 w-5" />
      </div>
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
                        <div className="border border-black bg-white p-2 shadow-sm">
                          <p className="font-bold">{payload[0].name}</p>
                          <p className="font-mono">R$ {Number(payload[0].value).toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={20}
                  formatter={(value) => (
                    <span style={{ color: '#000000' }}>{value}</span>
                  )}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '10px'
                  }}
                />
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
            <Button size="sm" variant="default" className="gap-1">
              Ver detalhes <ArrowRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
  );

  const ChildExpensesChartCard = () => (
    <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Gasto por Criança</h3>
        <BarChart2Icon className="h-5 w-5" />
      </div>
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
                      <div className="border border-black bg-white p-2 shadow-sm">
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
          <Button size="sm" variant="default" className="gap-1">
            Ver detalhes <ArrowRightIcon className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
  
  const DailyExpensesChartCard = () => (
    <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Gasto por Dia</h3>
        <BarChart2Icon className="h-5 w-5" />
      </div>
      {dateBarChartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dateBarChartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeWidth={1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#000000" strokeWidth={2} />
              <YAxis width={40} tick={{ fontSize: 10 }} stroke="#000000" strokeWidth={2} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="border border-black bg-white p-2 shadow-sm">
                        <p className="font-bold">{payload[0].payload.date}</p>
                        <p className="font-mono">R$ {Number(payload[0].value).toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" name="Despesas Diárias" fill="#4BC0C0" stroke="#000000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <p className="text-muted-foreground text-center">Sem dados diários suficientes</p>
        </div>
      )}
      <div className="mt-4 text-center">
        <Link href={`/${username}/financas`}>
          <Button size="sm" variant="default" className="gap-1">
            Ver detalhes <ArrowRightIcon className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    // Loading state - show skeleton cards in 3-column layout
    return (
      <>
        <div className="col-span-4 md:col-span-1">
          <div className="bg-white p-4 h-full">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="col-span-4 md:col-span-1">
          <div className="bg-white p-4 h-full">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="col-span-4 md:col-span-1">
          <div className="bg-white p-4 h-full">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-40 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="col-span-4 md:col-span-1">
          <div className="bg-white p-4 h-full">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-40 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!hasExpenses) {
    // No expenses state - show empty state card that spans 3 columns
    return (
      <div className="col-span-4 pb-[5em]">
        <div className="bg-white p-4 h-full border-2 border-black shadow-brutalist">
          <h3 className="text-lg font-bold mb-2">Resumo Financeiro</h3>
          <div className="p-6 text-center">
            {/* <BanknoteIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> */}
            <h3 className="text-lg font-bold mb-2">Sem despesas registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comece a registrar suas despesas para visualizar gráficos e análises aqui.
            </p>
            <Link href={`/${username}/financas`}>
              <Button className="gap-2 bg-main">
                Ir para Finanças
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full content state - show all cards in 3-column layout
  return (
    <>
      {/* <div className="col-span-4 md:col-span-1 mb-4">
        <div className='flex flex-col gap-4 sm:gap-[4em]'>
          <TotalExpenseCard />
          <ChildExpenseCard />
        </div>
      </div> */}
      <div className="col-span-4 md:col-span-1 mb-4">
        <CategoryPieChartCard />
      </div>
      <div className="col-span-4 md:col-span-1 mb-4">
        {dateBarChartData.length > 0 && <DailyExpensesChartCard />}
      </div>
      
      {/* Second row */}
      {hasChildExpenses && childExpenses.length > 0 && (
        <div className="col-span-4 md:col-span-1 mb-4">
          <ChildExpensesChartCard />
        </div>
      )}
    </>
  );
};