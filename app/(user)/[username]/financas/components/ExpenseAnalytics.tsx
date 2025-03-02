'use client';

import React from 'react';
import { Expense } from './types';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from './constants';

interface ExpenseAnalyticsProps {
  filteredExpenses: Expense[];
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({ filteredExpenses }) => {
  // Prepare chart data - expenses by category
  const categoryExpenses = EXPENSE_CATEGORIES.map(category => {
    const total = filteredExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { name: category, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
                 '#FF9F40', '#22CFCF', '#FF6B6B', '#7C7CFF'];
  
  // Prepare chart data - expenses by date
  const dateExpenses: Record<string, number> = {};
  
  filteredExpenses.forEach(expense => {
    const date = expense.date.toDate().toISOString().slice(0, 10);
    dateExpenses[date] = (dateExpenses[date] || 0) + expense.amount;
  });
  
  const sortedDates = Object.keys(dateExpenses).sort();
  
  const barChartData = sortedDates.map(date => {
    const [_year, month, day] = date.split('-');
    console.log(_year, month, day);
    return {
      date: `${day}/${month}`,
      amount: dateExpenses[date]
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {filteredExpenses.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-muted-foreground">
              Sem dados suficientes para análise
            </div>
          ) : (
            <>
              <div className="h-72 md:h-64">
                <h3 className="text-center text-base font-medium mb-3">Despesas por Categoria</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={true}
                      stroke="none"
                    >
                      {categoryExpenses.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-72 md:h-64">
                <h3 className="text-center text-base font-medium mb-3">Despesas por Dia</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis width={50} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="amount" name="Despesas por Dia" fill="#4BC0C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};