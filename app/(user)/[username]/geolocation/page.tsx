'use client';

import React, { useState, useCallback } from 'react';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Enhanced Marker Icon Configuration
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Hook for Map Recentering
function MapRecenter({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    React.useEffect(() => {
        map.setView([lat, lng], 13);
    }, [lat, lng, map]);
    return null;
}

export default function GeolocationPage() {
    // Enhanced State Management
    const [location, setLocation] = useState<{
        latitude: number,
        longitude: number,
        accuracy?: number
    } | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Improved Location Retrieval with Enhanced Options
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
            setError('Geolocation is not supported by this browser.');
            setIsLoading(false);
        }
    }, []);

    // Detailed Error Messaging
    function getGeolocationErrorMessage(error: GeolocationPositionError): string {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return "Location access denied. Please enable location permissions.";
            case error.POSITION_UNAVAILABLE:
                return "Location information is unavailable.";
            case error.TIMEOUT:
                return "Location request timed out. Please try again.";
            default:
                return "An unknown error occurred while retrieving location.";
        }
    }

    return (
        <div className="h-screen flex flex-col">
            <UserProfileBar pathname="Localização" />
            <div className="card max-w-xs bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-center">Location Tracker</h2>

                    {/* Enhanced Location Button with Loading State */}
                    <button
                        className={`btn btn-primary mt-4 ${isLoading ? 'btn-disabled loading' : ''}`}
                        onClick={handleGetLocation}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Locating...' : 'Get My Location'}
                    </button>

                    {/* Comprehensive Error Handling */}
                    {error && (
                        <div className="alert alert-error mt-4 flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="stroke-current shrink-0 h-6 w-6 mr-2"
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

                    {/* Enhanced Location Display and Map */}
                    {location && (
                        <div className="mt-4">
                            <div className="text-center bg-base-200 p-4 rounded-lg mb-4">
                                <h3 className="font-bold mb-2">Current Location Details</h3>
                                <p><strong>Latitude:</strong> {location.latitude.toFixed(4)}</p>
                                <p><strong>Longitude:</strong> {location.longitude.toFixed(4)}</p>
                                {location.accuracy && (
                                    <p><strong>Accuracy:</strong> {location.accuracy.toFixed(2)} meters</p>
                                )}
                            </div>

                            <div className="w-full h-[400px] z-[50]">
                                <MapContainer
                                    center={[location.latitude, location.longitude]}
                                    zoom={13}
                                    scrollWheelZoom={true}
                                    className="h-full w-full rounded-lg"
                                >
                                    <MapRecenter
                                        lat={location.latitude}
                                        lng={location.longitude}
                                    />
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[location.latitude, location.longitude]}>
                                        <Popup>
                                            You are here! <br />
                                            Lat: {location.latitude.toFixed(4)} <br />
                                            Lon: {location.longitude.toFixed(4)} <br />
                                            Accuracy: {location.accuracy?.toFixed(2)} meters
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <section className="flex flex-row flex-start gap-8 w-full mx-auto p-4">
                <div role="alert" className="alert alert-warning">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>EM DESENVOLVIMENTO</span>
                </div>
            </section >
        </div>
    );
}