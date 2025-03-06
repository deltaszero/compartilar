'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Initialize Leaflet icons
const InitializeIcons = () => {
  useEffect(() => {
    // Fix for Leaflet default icon issues
    delete (L.Icon.Default.prototype as {_getIconUrl?: unknown})._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);
  
  return null;
};

// Map controller component for initialization and handling resizes
function MapController({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  
  // Handle map initialization and resize
  useEffect(() => {
    if (!map) return;
    
    // Force map to update its size when component mounts
    const resizeHandler = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    // Add resize event listener
    window.addEventListener('resize', resizeHandler);
    // Initial resize
    resizeHandler();
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [map]);
  
  // Handle centering the map on coordinate changes
  useEffect(() => {
    if (!map || !map._loaded) return;
    
    try {
      // Add a small delay to ensure the map is ready
      const timer = setTimeout(() => {
        map.setView([lat, lng], 15, { animate: false });
      }, 200);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error setting map view:', error);
    }
  }, [lat, lng, map]);
  
  return null;
}

// Props interface
interface MapComponentsProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Main export component
export default function MapComponents({ latitude, longitude, accuracy }: MapComponentsProps) {
  // Apply fix for Leaflet in Next.js/React - ensure we have window object
  const [mapReady, setMapReady] = useState(false);
  
  useEffect(() => {
    // Make sure we're running on the client
    if (typeof window !== 'undefined') {
      setMapReady(true);
    }
  }, []);
  
  if (!mapReady) {
    return (
      <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
        Carregando mapa...
      </div>
    );
  }
  
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
      // Key helps re-render map when coordinates change
      key={`map-${latitude}-${longitude}`}
    >
      <InitializeIcons />
      <MapController lat={latitude} lng={longitude} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[latitude, longitude]}>
        <Popup>
          Você está aqui!<br />
          Latitude: {latitude.toFixed(5)}<br />
          Longitude: {longitude.toFixed(5)}<br />
          {accuracy && `Precisão: ${accuracy.toFixed(2)} metros`}
        </Popup>
      </Marker>
    </MapContainer>
  );
}