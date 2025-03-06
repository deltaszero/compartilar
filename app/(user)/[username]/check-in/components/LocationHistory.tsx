'use client';

import { useState, useEffect } from 'react';
import { getUserGeolocations, deleteGeolocation } from './geolocation-service';
import { useUser } from '@/context/userContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LocationHistory() {
  const { userData } = useUser();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      if (!userData?.uid) return;
      
      try {
        setLoading(true);
        const locationsData = await getUserGeolocations(userData.uid);
        setLocations(locationsData);
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
      setDeleteLocationId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-2 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-4 my-4">
        <p>{error}</p>
        <Button 
          variant="outline" 
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
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma localização salva</h3>
        <p className="text-muted-foreground text-sm">
          Suas localizações salvas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.map((location) => (
        <Card key={location.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-medium">
                  {format(location.timestamp.toDate(), 'PPP', { locale: ptBR })}
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground my-1">
                <Calendar className="h-3 w-3 inline-block mr-1" />
                {format(location.timestamp.toDate(), 'p', { locale: ptBR })}
              </p>
              
              <div className="text-xs mt-2 space-y-1">
                <p>Latitude: {location.coordinates.latitude.toFixed(5)}</p>
                <p>Longitude: {location.coordinates.longitude.toFixed(5)}</p>
                {location.note && (
                  <p className="italic mt-2 text-sm border-l-2 border-muted pl-2 py-1">
                    "{location.note}"
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                asChild
              >
                <a 
                  href={`https://maps.google.com/?q=${location.coordinates.latitude},${location.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir no Google Maps"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              
              <AlertDialog open={deleteLocationId === location.id} onOpenChange={() => setDeleteLocationId(null)}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteLocationId(location.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir localização?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Esta localização será removida permanentemente do seu histórico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}