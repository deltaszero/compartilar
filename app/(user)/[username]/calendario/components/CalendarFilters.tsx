'use client';

import { useState } from 'react';
import { Child } from '@/types/user.types';
import { CalendarFiltersProps } from './types';
import { Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuGroup,
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

// Available event categories
const EVENT_CATEGORIES = [
    { id: 'school', label: 'Escola' },
    { id: 'medical', label: 'Médico' },
    { id: 'activity', label: 'Atividade' },
    { id: 'visitation', label: 'Visitação' },
    { id: 'other', label: 'Outro' }
];

export function CalendarFilters({
    children = [],
    selectedChildren = [],
    onChildFilterChange,
    selectedCategories = [],
    onCategoryFilterChange
}: CalendarFiltersProps) {
    // Toggle child selection in filter
    const toggleChildFilter = (childId: string) => {
        if (selectedChildren.includes(childId)) {
            // Remove from selected
            onChildFilterChange(selectedChildren.filter(id => id !== childId));
        } else {
            // Add to selected
            onChildFilterChange([...selectedChildren, childId]);
        }
    };
    
    // Toggle category selection in filter
    const toggleCategoryFilter = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            // Remove from selected
            onCategoryFilterChange(selectedCategories.filter(id => id !== categoryId));
        } else {
            // Add to selected
            onCategoryFilterChange([...selectedCategories, categoryId]);
        }
    };
    
    // Select all children
    const selectAllChildren = () => {
        onChildFilterChange(children.map(child => child.id));
    };
    
    // Clear child filters
    const clearChildFilters = () => {
        onChildFilterChange([]);
    };
    
    // Select all categories
    const selectAllCategories = () => {
        onCategoryFilterChange(EVENT_CATEGORIES.map(cat => cat.id));
    };
    
    // Clear category filters
    const clearCategoryFilters = () => {
        onCategoryFilterChange([]);
    };
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold">Calendário Compartilhado</h2>
            
            <div className="flex space-x-3">
                {/* Child Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Crianças
                            {selectedChildren.length > 0 && (
                                <span className="ml-1 rounded-full bg-main w-5 h-5 text-white text-xs flex items-center justify-center">
                                    {selectedChildren.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filtre por criança</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {children.map(child => (
                                <DropdownMenuCheckboxItem
                                    key={child.id}
                                    checked={selectedChildren.includes(child.id)}
                                    onCheckedChange={() => toggleChildFilter(child.id)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                                            {child.photoURL ? (
                                                <Image
                                                    src={child.photoURL}
                                                    alt={`${child.firstName} ${child.lastName}`}
                                                    width={24}
                                                    height={24}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xs">
                                                    {child.firstName?.substring(0, 1)}
                                                </div>
                                            )}
                                        </div>
                                        <span>{child.firstName} {child.lastName}</span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={selectAllChildren}>
                            Selecionar todos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={clearChildFilters}>
                            Limpar seleção
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Category Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Categorias
                            {selectedCategories.length > 0 && (
                                <span className="ml-1 rounded-full bg-main w-5 h-5 text-white text-xs flex items-center justify-center">
                                    {selectedCategories.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filtre por categoria</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {EVENT_CATEGORIES.map(category => (
                                <DropdownMenuCheckboxItem
                                    key={category.id}
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => toggleCategoryFilter(category.id)}
                                >
                                    {category.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={selectAllCategories}>
                            Selecionar todos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={clearCategoryFilters}>
                            Limpar seleção
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}