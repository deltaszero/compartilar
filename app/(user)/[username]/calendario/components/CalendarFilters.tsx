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
        <div className="flex space-x-3">
            {/* Combined Filter Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="default" className="gap-2 px-4 text-md font-semibold font-raleway">
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(selectedChildren.length > 0 || selectedCategories.length > 0) && (
                            <span className="ml-1 rounded-full bg-blank w-5 h-5 text-white text-xs flex items-center justify-center font-raleway">
                                {selectedChildren.length + selectedCategories.length}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    {/* Children section */}
                    <DropdownMenuLabel>Crianças</DropdownMenuLabel>
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
                        <DropdownMenuSeparator />
                        <div className="flex justify-between px-2 py-1.5">
                            <DropdownMenuItem className="px-2 cursor-pointer" onClick={selectAllChildren}>
                                Todas
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-2 cursor-pointer" onClick={clearChildFilters}>
                                Nenhuma
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuGroup>

                    {/* Categories section */}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Categorias</DropdownMenuLabel>
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
                        <DropdownMenuSeparator />
                        <div className="flex justify-between px-2 py-1.5">
                            <DropdownMenuItem className="px-2 cursor-pointer" onClick={selectAllCategories}>
                                Todas
                            </DropdownMenuItem>
                            <DropdownMenuItem className="px-2 cursor-pointer" onClick={clearCategoryFilters}>
                                Nenhuma
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}