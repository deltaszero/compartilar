'use client';

import React, { useState, useEffect } from 'react';
import { Expense, Friend } from './types';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { Trash2, ArrowUpDown, MoreHorizontal, ChevronDown, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

export type UserData = {
  uid: string;
  firstName?: string;
  lastName?: string;
  username: string;
  photoURL?: string;
};

interface ExpenseListProps {
  isLoadingExpenses: boolean;
  filteredExpenses: Expense[];
  userData: UserData;
  friends: Friend[];
  handleDeleteExpense: (expenseId: string) => void;
  handleViewExpense?: (expense: Expense) => void;
  handleEditExpense?: (expense: Expense) => void;
  children?: { [id: string]: { firstName: string; lastName: string; photoURL?: string } };
}

// Helper to format date
const formatDate = (timestamp: { toDate: () => Date }): string => {
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

export const ExpenseList: React.FC<ExpenseListProps> = ({
  isLoadingExpenses,
  filteredExpenses,
  userData,
  friends,
  handleDeleteExpense,
  handleViewExpense = () => {},
  handleEditExpense = () => {},
  children = {}
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  
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
  
  // Log children data for debugging purposes only
  useEffect(() => {
    console.log('Children data:', children);
    
    if (filteredExpenses.length > 0 && filteredExpenses[0].childrenIds) {
      console.log('First expense childrenIds:', filteredExpenses[0].childrenIds);
      
      if (filteredExpenses[0].childrenIds.length > 0) {
        const firstChildId = filteredExpenses[0].childrenIds[0];
        console.log('First child ID:', firstChildId);
        console.log('First child data:', children[firstChildId]);
      }
    }
  }, [children, filteredExpenses]);
  
  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.date;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="noShadow"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Descrição
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="max-w-[200px] truncate">{row.original.description}</div>;
      },
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => {
        return <Badge variant="default">{row.getValue("category")}</Badge>;
      },
    },
    {
      accessorKey: "childrenIds",
      header: "Crianças",
      cell: ({ row }) => {
        const childrenIds = row.original.childrenIds || [];
        
        if (childrenIds.length === 0) {
          return <div className="text-gray-400 text-sm">-</div>;
        }
        
        // Custom avatar display workaround
        return (
          <div className="flex -space-x-2 overflow-hidden">
            {childrenIds.slice(0, 3).map((childId, index) => {
              const child = children[childId];
              let initials = `${index + 1}`;
              
              // Only attempt to get initials if child data exists and has name properties
              if (child && (child.firstName || child.lastName)) {
                const firstInitial = child.firstName && child.firstName.length > 0 ? child.firstName[0] : '';
                const lastInitial = child.lastName && child.lastName.length > 0 ? child.lastName[0] : '';
                if (firstInitial || lastInitial) {
                  initials = `${firstInitial}${lastInitial}`;
                }
              }
              
              // Custom avatar component using div instead of the Avatar component
              return (
                <div 
                  key={childId} 
                  className="h-6 w-6 rounded-full border-2 border-background relative flex items-center justify-center"
                  style={{ 
                    backgroundColor: child && child.photoURL ? 'transparent' : '#E2E8F0',
                    backgroundImage: child && child.photoURL ? `url(${child.photoURL})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    overflow: 'hidden',
                    zIndex: 10 - index
                  }}
                >
                  {(!child || !child.photoURL) && (
                    <span className="text-xs font-medium text-gray-700">
                      {initials}
                    </span>
                  )}
                </div>
              );
            })}
            
            {childrenIds.length > 3 && (
              <div 
                className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center"
                style={{ zIndex: 7 }}
              >
                <span className="text-xs font-medium text-gray-700">
                  +{childrenIds.length - 3}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "paidBy",
      header: "Pago por",
      cell: ({ row }) => {
        const uid = row.getValue("paidBy") as string;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              {getUserPhoto(uid) && (
                <AvatarImage src={getUserPhoto(uid)} alt="Pago por" />
              )}
              <AvatarFallback className="text-xs">{getUserName(uid).charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{getUserName(uid)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Valor</div>,
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const formatted = `R$ ${amount.toFixed(2)}`;
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleViewExpense(expense)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar despesa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir despesa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredExpenses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingExpenses ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Sem despesas neste período
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filtrar descrição..."
                value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("description")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="noShadow" className="ml-auto">
                    Colunas <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id === "date" && "Data"}
                          {column.id === "description" && "Descrição"}
                          {column.id === "category" && "Categoria"}
                          {column.id === "childrenIds" && "Crianças"}
                          {column.id === "paidBy" && "Pago por"}
                          {column.id === "amount" && "Valor"}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="rounded-md">
                <Table>
                  <TableHeader className="font-heading">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          Nenhum resultado encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                  <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {table.getRowModel().rows.map((row) => (
                <div key={row.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium">{row.original.description}</div>
                      <div className="flex space-x-2 text-sm">
                        <Badge variant="default" className="h-5">{row.original.category}</Badge>
                        <span className="text-gray-400">{formatDate(row.original.date)}</span>
                      </div>
                    </div>
                    <div className="flex -space-x-1">
                      <Button 
                        variant="default" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleViewExpense(row.original)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditExpense(row.original)}
                        title="Editar despesa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteExpense(row.original.id)}
                        title="Excluir despesa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Children if any */}
                  {row.original.childrenIds && row.original.childrenIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Crianças:</span>
                        <div className="flex -space-x-2 overflow-hidden">
                          {row.original.childrenIds.slice(0, 3).map((childId, index) => {
                            const child = children[childId];
                            let initials = `${index + 1}`;
                            
                            // Only attempt to get initials if child data exists and has name properties
                            if (child && (child.firstName || child.lastName)) {
                              const firstInitial = child.firstName && child.firstName.length > 0 ? child.firstName[0] : '';
                              const lastInitial = child.lastName && child.lastName.length > 0 ? child.lastName[0] : '';
                              if (firstInitial || lastInitial) {
                                initials = `${firstInitial}${lastInitial}`;
                              }
                            }
                            
                            // Custom avatar component using div
                            return (
                              <div 
                                key={childId} 
                                className="h-5 w-5 rounded-full border-2 border-background relative flex items-center justify-center"
                                style={{ 
                                  backgroundColor: child && child.photoURL ? 'transparent' : '#E2E8F0',
                                  backgroundImage: child && child.photoURL ? `url(${child.photoURL})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  overflow: 'hidden',
                                  zIndex: 10 - index
                                }}
                              >
                                {(!child || !child.photoURL) && (
                                  <span className="text-[10px] font-medium text-gray-700">
                                    {initials}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          
                          {row.original.childrenIds.length > 3 && (
                            <div 
                              className="h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center"
                              style={{ zIndex: 7 }}
                            >
                              <span className="text-[10px] font-medium text-gray-700">
                                +{row.original.childrenIds.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-5 w-5">
                        {getUserPhoto(row.original.paidBy) && (
                          <AvatarImage src={getUserPhoto(row.original.paidBy)} alt="Pago por" />
                        )}
                        <AvatarFallback className="text-[10px]">{getUserName(row.original.paidBy).charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getUserName(row.original.paidBy)}</span>
                    </div>
                    <div className="font-medium">
                      R$ {row.original.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              {table.getRowModel().rows?.length > 5 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="noShadow"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Próximo
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};