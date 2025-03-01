'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Enhanced Marker Icon Configuration - directly from original working code
const InitializeIcons = () => {
  useEffect(() => {
    // Need to run once after Leaflet is loaded
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);
  
  return null;
};

// Custom Hook for Map Recentering
function MapRecenter({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], 13);
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
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
    >
      <InitializeIcons />
      <MapRecenter lat={latitude} lng={longitude} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[latitude, longitude]}>
        <Popup>
          Você está aqui!<br />
          Lat: {latitude.toFixed(4)}<br />
          Lon: {longitude.toFixed(4)}<br />
          {accuracy && `Precisão: ${accuracy.toFixed(2)} metros`}
        </Popup>
      </Marker>
    </MapContainer>
  );
}