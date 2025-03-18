'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Copy, ExternalLink, Save, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { saveGeolocation } from './geolocation-service';

// Dynamically import Leaflet components to prevent SSR issues
const MapComponents = dynamic(
  () => import('./MapComponents'),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-60 bg-muted animate-pulse rounded-lg flex items-center justify-center">Carregando mapa...</div> 
  }
);

// Main component
export default function CheckInContent() {
    const [location, setLocation] = useState<{
        latitude: number,
        longitude: number,
        accuracy?: number
    } | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [note, setNote] = useState<string>('');
    const [savedLocationId, setSavedLocationId] = useState<string | null>(null);
    const { toast } = useToast();

    // Handle client-side mounting
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Location retrieval handler
    const handleGetLocation = useCallback(() => {
        setIsLoading(true);
        setError(null);
        setSavedLocationId(null);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setLocation(coords);
                    setIsLoading(false);
                },
                (err) => {
                    setError(getGeolocationErrorMessage(err));
                    setIsLoading(false);
                },
                {
                    enableHighAccuracy: true,  // Request most accurate location
                    timeout: 10000,            // 10 seconds timeout
                    maximumAge: 0              // No cached location
                }
            );
        } else {
            setError('Geolocalização não é suportada por este navegador.');
            setIsLoading(false);
        }
    }, []);

    // Save location to database
    const handleSaveLocation = useCallback(async () => {
        if (!location) return;
        
        try {
            setIsSaving(true);
            
            // Save location to Firestore, only pass note if it has content
            const trimmedNote = note.trim();
            const locationId = await saveGeolocation(
                location, 
                trimmedNote.length > 0 ? trimmedNote : null
            );
            
            if (locationId) {
                setSavedLocationId(locationId);
                toast({
                    title: "Localização salva!",
                    description: "Sua localização foi armazenada com sucesso.",
                });
                
                // Clear note after saving
                setNote('');
            }
        } catch (error) {
            console.error('Error saving location:', error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Não foi possível salvar sua localização. Tente novamente.",
            });
        } finally {
            setIsSaving(false);
        }
    }, [location, note, toast]);

    // Copy location to clipboard
    const copyLocationLink = useCallback(() => {
        if (location) {
            const text = `Minha localização: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
            navigator.clipboard.writeText(text);
            toast({
                title: "Link copiado!",
                description: "Link da localização copiado para a área de transferência.",
            });
        }
    }, [location, toast]);

    // Error message handler
    function getGeolocationErrorMessage(error: GeolocationPositionError): string {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return "Acesso à localização negado. Por favor, habilite as permissões de localização.";
            case error.POSITION_UNAVAILABLE:
                return "Informações de localização não disponíveis.";
            case error.TIMEOUT:
                return "O pedido de localização expirou. Por favor, tente novamente.";
            default:
                return "Ocorreu um erro ao obter a localização. Por favor, tente novamente.";
        }
    }

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl md:text-2xl flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5" /> 
                    Compartilhar Localização
                </CardTitle>
                <CardDescription className="text-center">
                    Compartilhe sua posição para facilitar encontros
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Location Button */}
                <Button 
                    variant="default" 
                    size="lg" 
                    className="w-full"
                    onClick={handleGetLocation}
                    disabled={isLoading}
                >
                    {isLoading ? 'Localizando...' : 'Obter Localização'}
                    <MapPin className="ml-2 h-4 w-4" />
                </Button>
                
                {/* Additional guidance for mobile */}
                {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !location && !error && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                        Permita o acesso à sua localização quando solicitado
                    </p>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/10 text-destructive rounded-md p-4 mt-4">
                        <p className="font-medium">{error}</p>
                        
                        {/* Permission guidance */}
                        {error.includes("permissões") || error.includes("localização") ? (
                            <div className="mt-2 text-sm">
                                <p>Para compartilhar sua localização, você precisa permitir o acesso nas configurações do seu dispositivo.</p>
                                {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
                                    <Button 
                                        variant="default" 
                                        className="p-0 h-auto text-sm mt-2"
                                        onClick={() => {
                                            window.open('https://support.google.com/chrome/answer/142065', '_blank');
                                        }}
                                    >
                                        Como ativar permissões de localização?
                                    </Button>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Location Results */}
                {location && (
                    <div className="space-y-4 mt-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-medium text-center mb-2">Detalhes da Localização</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><span className="font-medium">Latitude:</span> {location.latitude.toFixed(5)}</p>
                                <p><span className="font-medium">Longitude:</span> {location.longitude.toFixed(5)}</p>
                                {location.accuracy && (
                                    <p className="col-span-2">
                                        <span className="font-medium">Precisão:</span> {location.accuracy.toFixed(2)} metros
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Map Component - Only render on client side */}
                        {isMounted && (
                            <div className="w-full h-60 md:h-80 relative rounded-lg overflow-hidden border">
                                <MapComponents 
                                    latitude={location.latitude}
                                    longitude={location.longitude}
                                    accuracy={location.accuracy}
                                />
                            </div>
                        )}

                        {/* Save Location Section */}
                        {!savedLocationId && (
                            <div className="space-y-3 border border-border p-4 rounded-lg">
                                <h3 className="font-medium text-center">Salvar esta localização</h3>
                                
                                <Textarea 
                                    placeholder="Adicione uma nota (opcional)..."
                                    className="resize-none"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                                
                                <Button 
                                    variant="default"
                                    className="w-full"
                                    onClick={handleSaveLocation}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Localização'}
                                    <Save className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        
                        {/* Success Alert */}
                        {savedLocationId && (
                            <Alert className="bg-green-50 text-green-800 border-green-200">
                                <Database className="h-4 w-4" />
                                <AlertTitle>Localização salva com sucesso!</AlertTitle>
                                <AlertDescription>
                                    Sua localização foi armazenada e pode ser compartilhada.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button 
                                variant="default"
                                size="sm"
                                onClick={copyLocationLink}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Link
                            </Button>
                            <Button 
                                variant="default"
                                size="sm"
                                asChild
                            >
                                <a 
                                    href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Google Maps
                                </a>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}