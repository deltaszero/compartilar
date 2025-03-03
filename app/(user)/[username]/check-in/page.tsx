'use client';

import React, { useState, useCallback, useEffect } from 'react';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to prevent SSR issues
const MapComponents = dynamic(
  () => import('./MapComponents'),
  { ssr: false, loading: () => <div className="w-full h-[250px] bg-gray-200 animate-pulse rounded-lg"></div> }
);

// Moved to MapComponents.tsx

// Main component
export default function GeolocationPage() {
    const [location, setLocation] = useState<{
        latitude: number,
        longitude: number,
        accuracy?: number
    } | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Handle client-side mounting
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Location retrieval handler - EXACT copy from working OLD.tsx
    const handleGetLocation = useCallback(() => {
        setIsLoading(true);
        setError(null);

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
                    maximumAge: 0             // No cached location
                }
            );
        } else {
            setError('Geolocalização não é suportada por este navegador.');
            setIsLoading(false);
        }
    }, []);

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
        <div className="flex flex-col w-full min-h-screen pb-16 md:pb-0">
            <UserProfileBar pathname="Localização" />
            
            {/* Main content area */}
            <div className="flex-1 p-2 md:p-4 overflow-y-auto">
                <div className="card w-full mx-auto bg-base-100 shadow-xl mb-4 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
                    <div className="card-body p-3 sm:p-6">
                        <h2 className="card-title text-center w-full justify-center font-playfair text-lg sm:text-xl mb-1 sm:mb-2">
                            Compartilhar Localização
                        </h2>
                        
                        <p className="text-xs sm:text-sm text-gray-600 text-center mb-3">
                            Compartilhe sua posição para facilitar encontros
                        </p>

                        {/* Location Button */}
                        <button
                            className={`btn btn-primary w-full text-xs sm:text-sm ${isLoading ? 'loading' : ''}`}
                            onClick={handleGetLocation}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Localizando...' : 'Localizar'}
                        </button>
                        
                        {/* Additional guidance for mobile */}
                        {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !location && !error && (
                            <div className="mt-2 text-xs text-center text-gray-500">
                                Permita o acesso à sua localização quando solicitado
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="alert alert-error mt-4 text-xs sm:text-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="stroke-current shrink-0 h-4 w-4 sm:h-6 sm:w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {error && (error.includes("permissões") || error.includes("localização")) && (
                            <div className="mt-2 text-xs sm:text-sm text-center text-gray-600">
                                <p>Para compartilhar sua localização, você precisa permitir o acesso nas configurações do seu dispositivo.</p>
                                {/Android/i.test(navigator.userAgent) ? (
                                    <div className="text-left mt-2 bg-base-200 p-2 rounded-lg">
                                        <p className="font-bold">Como permitir no Android:</p>
                                        <ol className="list-decimal pl-5 text-xs">
                                            <li>Acesse Configurações do seu telefone</li>
                                            <li>Toque em Aplicativos &gt; Chrome</li>
                                            <li>Toque em Permissões &gt; Localização</li>
                                            <li>Selecione &quot;Permitir&quot;</li>
                                            <li>Volte e tente novamente</li>
                                        </ol>
                                    </div>
                                ) : /iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
                                    <div className="text-left mt-2 bg-base-200 p-2 rounded-lg">
                                        <p className="font-bold">Como permitir no iOS:</p>
                                        <ol className="list-decimal pl-5 text-xs">
                                            <li>Acesse Ajustes do seu iPhone</li>
                                            <li>Role até Safari ou Chrome</li>
                                            <li>Toque em Localização</li>
                                            <li>Selecione &quot;Ao Usar o App&quot;</li>
                                            <li>Volte e tente novamente</li>
                                        </ol>
                                    </div>
                                ) : (
                                    <button 
                                        className="btn btn-xs btn-link mt-1"
                                        onClick={() => {
                                            window.open('https://support.google.com/chrome/answer/142065', '_blank');
                                        }}
                                    >
                                        Como ativar permissões?
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Location Results */}
                        {location && (
                            <div className="mt-4 w-full">
                                <div className="bg-base-200 p-3 rounded-lg mb-4">
                                    <h3 className="font-bold text-center mb-2">Detalhes da Localização</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><strong>Latitude:</strong> {location.latitude.toFixed(4)}</p>
                                        <p><strong>Longitude:</strong> {location.longitude.toFixed(4)}</p>
                                        {location.accuracy && (
                                            <p className="col-span-2"><strong>Precisão:</strong> {location.accuracy.toFixed(2)} metros</p>
                                        )}
                                    </div>
                                </div>

                                {/* Map Component - Only render on client side */}
                                {isMounted && (
                                    <>
                                        <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] relative rounded-lg overflow-hidden">
                                            <MapComponents 
                                                latitude={location.latitude}
                                                longitude={location.longitude}
                                                accuracy={location.accuracy}
                                            />
                                        </div>

                                        <div className="flex flex-wrap justify-center mt-4 gap-2">
                                            <button 
                                                className="btn btn-xs sm:btn-sm btn-primary text-xs"
                                                onClick={() => {
                                                    // Copy location to clipboard
                                                    const text = `Minha localização: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                                                    navigator.clipboard.writeText(text);
                                                    alert('Link copiado para a área de transferência!');
                                                }}
                                            >
                                                Copiar Link
                                            </button>
                                            <a 
                                                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer" 
                                                className="btn btn-xs sm:btn-sm btn-outline text-xs"
                                            >
                                                Google Maps
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}