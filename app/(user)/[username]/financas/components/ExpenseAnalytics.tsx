'use client';

import React from 'react';
import { Child, Expense } from './types';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from './constants';

interface ExpenseAnalyticsProps {
  filteredExpenses: Expense[];
  children?: Child[];
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({ filteredExpenses, children = [] }) => {
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
    return {
      date: `${day}/${month}`,
      amount: dateExpenses[date]
    };
  });
  
  // Prepare chart data - expenses by child
  const childrenMap = children && children.length > 0 
    ? new Map(children.map(child => [child.id, `${child.firstName} ${child.lastName}`]))
    : new Map();
  
  const childExpenses = Array.from(childrenMap.entries()).map(([childId, childName]) => {
    const total = filteredExpenses
      .filter(expense => expense.childrenIds?.includes(childId))
      .reduce((sum, expense) => sum + expense.amount, 0);
    return { name: childName, value: total };
  }).filter(item => item.value > 0);
  
  // Sort child expenses by value (descending)
  childExpenses.sort((a, b) => b.value - a.value);

  return (
    <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <CardHeader className="bg-yellow-300 border-b-4 border-black">
        <CardTitle className="uppercase font-extrabold tracking-wide">ANÁLISE DE DESPESAS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {filteredExpenses.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-gray-400 font-bold uppercase">
              Sem dados suficientes para análise
            </div>
          ) : (
            <>
              <div className="h-72 md:h-64 border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
                <h3 className="text-center text-base font-bold uppercase mb-3">Despesas por Categoria</h3>
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
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-72 md:h-64 border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
                <h3 className="text-center text-base font-bold uppercase mb-3">Despesas por Dia</h3>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeWidth={1} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#000000" strokeWidth={2} />
                    <YAxis width={50} tick={{ fontSize: 12 }} stroke="#000000" strokeWidth={2} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="border-4 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                              <p className="font-bold">{payload[0].payload.date}</p>
                              <p className="font-mono">R$ {Number(payload[0].value).toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="amount" name="Despesas por Dia" fill="#4BC0C0" stroke="#000000" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {childExpenses.length > 0 && (
                <div className="h-72 md:h-64 border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] md:col-span-2">
                  <h3 className="text-center text-base font-bold uppercase mb-3">Despesas por Criança</h3>
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
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} stroke="#000000" strokeWidth={2} />
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
                      <Legend verticalAlign="bottom" height={36} />
                      <Bar dataKey="value" name="Despesas por Criança" fill="#FF6384" stroke="#000000" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};