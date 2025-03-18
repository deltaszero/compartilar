'use client';

import { useState, useEffect } from 'react';
import { getUserGeolocations, deleteGeolocation } from './geolocation-service';
import { useUser } from '@/context/userContext';
import { format, parse, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, ExternalLink, Calendar, ArrowUpDown, ChevronDown, Filter, MapPinOff, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
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
import { GeoLocation } from '@/types/shared.types';

export function LocationHistory() {
  const { userData } = useUser();
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, locationId: string | null}>({
    open: false,
    locationId: null
  });
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
    active: boolean;
  }>({
    startDate: '',
    endDate: '',
    active: false
  });

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    async function fetchLocations() {
      if (!userData?.uid) return;
      
      try {
        setLoading(true);
        const locationsData = await getUserGeolocations(userData.uid);
        setLocations(locationsData);
        setFilteredLocations(locationsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching location history:', error);
        setError('Não foi possível carregar o histórico de localizações.');
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [userData]);

  // Apply date filters to locations
  useEffect(() => {
    if (!dateFilter.active) {
      setFilteredLocations(locations);
      return;
    }

    let filtered = [...locations];
    
    if (dateFilter.startDate) {
      const startDate = parse(dateFilter.startDate, 'yyyy-MM-dd', new Date());
      filtered = filtered.filter(loc => 
        isAfter(loc.timestamp.toDate(), startOfDay(startDate))
      );
    }
    
    if (dateFilter.endDate) {
      const endDate = parse(dateFilter.endDate, 'yyyy-MM-dd', new Date());
      filtered = filtered.filter(loc => 
        isBefore(loc.timestamp.toDate(), endOfDay(endDate))
      );
    }
    
    setFilteredLocations(filtered);
  }, [locations, dateFilter]);

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await deleteGeolocation(locationId);
      
      // Update the local state
      setLocations(locations.filter(loc => loc.id !== locationId));
      
      toast({
        title: "Localização excluída",
        description: "A localização foi removida do seu histórico.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir a localização. Tente novamente.",
      });
      console.error('Error deleting location:', error);
    } finally {
      setDeleteDialog({open: false, locationId: null});
    }
  };

  // Table columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="default"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            Data/Hora
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.original.timestamp;
        return (
          <div>
            <div className="font-medium">{format(timestamp.toDate(), 'dd/MM/yyyy', { locale: ptBR })}</div>
            <div className="text-xs text-gray-400">{format(timestamp.toDate(), 'HH:mm', { locale: ptBR })}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "coordinates",
      header: "Coordenadas",
      cell: ({ row }) => {
        const coordinates = row.getValue("coordinates") as { latitude: number; longitude: number; accuracy?: number };
        return (
          <div className="text-xs">
            <div>Lat: {coordinates.latitude.toFixed(5)}</div>
            <div>Lng: {coordinates.longitude.toFixed(5)}</div>
            {coordinates.accuracy && (
              <div className="text-gray-400">Precisão: {coordinates.accuracy.toFixed(0)}m</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Nota",
      cell: ({ row }) => {
        const note = row.getValue("note") as string;
        if (!note) {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        return (
          <div className="max-w-[200px] truncate text-sm">{note}</div>
        );
      },
    },
    {
      accessorKey: "deviceInfo",
      header: "Dispositivo",
      cell: ({ row }) => {
        const deviceInfo = row.getValue("deviceInfo") as { 
          browser: string; 
          platform: string; 
          mobile: boolean;
        };
        
        if (!deviceInfo) {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        
        return (
          <div className="text-xs">
            <Badge variant="default" className="mr-1">
              {deviceInfo.platform}
            </Badge>
            <Badge variant="default" className="mr-1">
              {deviceInfo.browser}
            </Badge>
            {deviceInfo.mobile && (
              <Badge variant="default">
                Mobile
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const location = row.original;
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
                <DropdownMenuItem asChild>
                  <a 
                    href={`https://maps.google.com/?q=${location.coordinates.latitude},${location.coordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver no Google Maps
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialog({open: true, locationId: location.id})}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir localização
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Set up the table
  const table = useReactTable({
    data: filteredLocations,
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Function to apply date filters
  const applyDateFilters = () => {
    setDateFilter(prev => ({...prev, active: true}));
  };

  // Function to clear date filters
  const clearDateFilters = () => {
    setDateFilter({
      startDate: '',
      endDate: '',
      active: false
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-4 my-4">
        <p>{error}</p>
        <Button 
          variant="default" 
          className="mt-2" 
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPinOff className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma localização salva</h3>
        <p className="text-gray-400 text-sm">
          Suas localizações salvas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Histórico de Localizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-2 py-4">
              {/* Note filter */}
              <Input
                placeholder="Filtrar por nota..."
                value={(table.getColumn("note")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("note")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              
              {/* Date filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="default" className="ml-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtro de Data
                    {dateFilter.active && <Badge className="ml-2" variant="default">Ativo</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filtrar por período</h4>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <label htmlFor="startDate">Data inicial:</label>
                        <Input
                          id="startDate"
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                          className="col-span-2"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <label htmlFor="endDate">Data final:</label>
                        <Input
                          id="endDate"
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                          className="col-span-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="default" onClick={clearDateFilters}>
                        Limpar
                      </Button>
                      <Button onClick={applyDateFilters}>
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Column visibility dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="ml-auto">
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
                          {column.id === "timestamp" && "Data/Hora"}
                          {column.id === "coordinates" && "Coordenadas"}
                          {column.id === "note" && "Nota"}
                          {column.id === "deviceInfo" && "Dispositivo"}
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
              
              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-400">
                  Mostrando {table.getRowModel().rows.length} de {filteredLocations.length} local(is)
                </div>
                <div className="space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="default"
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
                      <div className="font-medium">
                        {format(row.original.timestamp.toDate(), 'PPP', { locale: ptBR })}
                      </div>
                      <div className="text-sm text-gray-400">
                        {format(row.original.timestamp.toDate(), 'HH:mm', { locale: ptBR })}
                      </div>
                      
                      <div className="text-xs mt-2">
                        <p>Lat: {row.original.coordinates.latitude.toFixed(5)}</p>
                        <p>Lng: {row.original.coordinates.longitude.toFixed(5)}</p>
                      </div>
                      
                      {row.original.note && (
                        <div className="mt-2 pt-2 border-t border-dashed">
                          <p className="text-sm italic">"{row.original.note}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="default" 
                        size="icon"
                        className="h-7 w-7"
                        asChild
                      >
                        <a 
                          href={`https://maps.google.com/?q=${row.original.coordinates.latitude},${row.original.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteDialog({
                          open: true,
                          locationId: row.original.id
                        })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mobile Pagination */}
              {table.getRowModel().rows?.length > 5 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <div className="text-sm text-gray-400">
                    Página {table.getState().pagination.pageIndex + 1}
                  </div>
                  <Button
                    variant="default"
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({...deleteDialog, open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir localização?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Esta localização será removida permanentemente do seu histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => setDeleteDialog({open: false, locationId: null})}
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (deleteDialog.locationId) {
                  handleDeleteLocation(deleteDialog.locationId);
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}