import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Sparkles, Filter } from "lucide-react";
import { DayEventsProps } from "./types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubscriptionButton } from "@/app/components/logged-area/ui/SubscriptionButton";
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
import { cn } from "@/lib/utils";

// Available event categories
const EVENT_CATEGORIES = [
    { id: 'school', label: 'Escola' },
    { id: 'medical', label: 'Médico' },
    { id: 'activity', label: 'Atividade' },
    { id: 'visitation', label: 'Visitação' },
    { id: 'other', label: 'Outro' }
];

export function DayEvents({
    selectedDate,
    events,
    onAddEvent,
    onEditEvent,
    onDeleteEvent,
    isLoading,
    // Calendar filters props
    children = [],
    selectedChildren = [],
    onChildFilterChange,
    selectedCategories = [],
    onCategoryFilterChange
}: DayEventsProps) {
    const { isPremium, remainingFreeTierLimits } = usePremiumFeatures();
    const categoryColors = {
        school: 'bg-blue-500',
        medical: 'bg-red-500',
        activity: 'bg-green-500',
        visitation: 'bg-purple-500',
        other: 'bg-gray-500'
    };

    return (
        <div className="border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
            <div className="flex flex-col justify-between gap-4 mb-4">
                <h3 className="font-bold font-raleway text-xl">
                    {selectedDate
                        ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })
                        : "Selecione uma data"}
                </h3>

                <div className="flex flex-wrap gap-2">
                    {selectedDate && (
                        <Button
                            variant="default"
                            onClick={() => selectedDate && onAddEvent(selectedDate)}
                            className={cn(
                                "bg-secondaryMain px-4 text-md font-semibold font-raleway"
                        )}>
                            <Plus/>
                            <span>Adicionar</span>
                        </Button>
                    )}

                    {onChildFilterChange && onCategoryFilterChange && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" className="gap-2 text-md font-semibold font-raleway h-10">
                                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Filtros</span>
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
                                            onCheckedChange={() => {
                                                if (selectedChildren.includes(child.id)) {
                                                    // Remove from selected
                                                    onChildFilterChange(selectedChildren.filter(id => id !== child.id));
                                                } else {
                                                    // Add to selected
                                                    onChildFilterChange([...selectedChildren, child.id]);
                                                }
                                            }}
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
                                        <DropdownMenuItem className="px-2 cursor-pointer" onClick={() => onChildFilterChange(children.map(child => child.id))}>
                                            Todas
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="px-2 cursor-pointer" onClick={() => onChildFilterChange([])}>
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
                                            onCheckedChange={() => {
                                                if (selectedCategories.includes(category.id)) {
                                                    // Remove from selected
                                                    onCategoryFilterChange(selectedCategories.filter(id => id !== category.id));
                                                } else {
                                                    // Add to selected
                                                    onCategoryFilterChange([...selectedCategories, category.id]);
                                                }
                                            }}
                                        >
                                            {category.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <div className="flex justify-between px-2 py-1.5">
                                        <DropdownMenuItem className="px-2 cursor-pointer" onClick={() => onCategoryFilterChange(EVENT_CATEGORIES.map(cat => cat.id))}>
                                            Todas
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="px-2 cursor-pointer" onClick={() => onCategoryFilterChange([])}>
                                            Nenhuma
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {!selectedDate && (
                <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] border-2 border-dashed border-gray-300 p-4">
                    <p className="text-gray-400 text-center text-sm">
                        Selecione uma data para ver ou criar eventos
                    </p>
                </div>
            )}

            {selectedDate && events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] border-[1px] border-dashed border-blank p-4">
                    <p className="text-sm p-2 font-nunito">
                        Nenhum evento para esta data.
                    </p>
                    {/* <Button
                        variant="default"
                        onClick={() => selectedDate && onAddEvent(selectedDate)}
                        className="bg-secondaryMain px-4 text-md font-semibold font-raleway"
                    >
                        Criar um evento
                    </Button> */}
                </div>
            )}

            {selectedDate && events.length > 0 && (
                <div className="space-y-3 mt-2 max-h-[calc(100vh-250px)]">
                    {events.map((event) => (
                        <div key={event.id} className="border-2 border-black p-3 sm:p-4 bg-white shadow-brutalist">
                            <div className="flex justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${categoryColors[event.category || 'other']}`}></div>
                                        <h4 className="font-bold text-sm sm:text-base truncate">{event.title}</h4>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                        <Badge variant="default" className="bg-white border-black text-[10px] sm:text-xs">
                                            {event.startDate && typeof event.startDate.toDate === 'function' 
                                                ? format(event.startDate.toDate(), 'HH:mm')
                                                : '00:00'}
                                            {' - '}
                                            {event.endDate && typeof event.endDate.toDate === 'function' 
                                                ? format(event.endDate.toDate(), 'HH:mm') 
                                                : (event.startDate && typeof event.startDate.toDate === 'function'
                                                    ? format(event.startDate.toDate(), 'HH:mm')
                                                    : '00:00')}
                                        </Badge>

                                        {event.location?.address && (
                                            <Badge variant="default" className="bg-white border-black text-[10px] sm:text-xs mt-1 sm:mt-0">
                                                {event.location.address}
                                            </Badge>
                                        )}
                                    </div>

                                    {event.description && (
                                        <p className="text-xs sm:text-sm mt-2 line-clamp-2">{event.description}</p>
                                    )}

                                    {event.childName && (
                                        <div className="flex items-center gap-1 mt-2">
                                            {event.childPhotoURL ? (
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden border border-black">
                                                    <Image
                                                        src={event.childPhotoURL}
                                                        alt={event.childName}
                                                        width={20}
                                                        height={20}
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 border border-black"></div>
                                            )}
                                            <span className="text-[10px] sm:text-xs">{event.childName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 ml-2">
                                    <Button
                                        variant="neutral"
                                        size="icon"
                                        onClick={() => selectedDate && onEditEvent(selectedDate, event)}
                                        className="h-6 w-6 sm:h-7 sm:w-7 rounded border-2 border-black hover:bg-black hover:text-white transition-colors p-0"
                                    >
                                        <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    </Button>
                                    <Button
                                        variant="neutral"
                                        size="icon"
                                        onClick={() => onDeleteEvent(event.id)}
                                        className="h-6 w-6 sm:h-7 sm:w-7 rounded border-2 border-red-800 hover:bg-red-800 hover:text-white transition-colors p-0"
                                    >
                                        <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}