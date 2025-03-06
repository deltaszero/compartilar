'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, History } from 'lucide-react';
import { LocationHistory } from './LocationHistory';
import dynamic from 'next/dynamic';

// Dynamically import the CheckInContent component since it contains the map
const CheckInContent = dynamic(
  () => import('./CheckInContent'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-60 bg-muted animate-pulse rounded-lg flex items-center justify-center">
        Carregando mapa...
      </div>
    )
  }
);

export function CheckInTabs() {
  const [activeTab, setActiveTab] = useState("checkin");
  const [hasHydrated, setHasHydrated] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="checkin" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 w-full mb-6">
        <TabsTrigger value="checkin" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>Check-in</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Histórico</span>
        </TabsTrigger>
      </TabsList>

      {/* Check-in Tab */}
      <TabsContent value="checkin">
        <CheckInContent />
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history">
        <LocationHistory />
      </TabsContent>
    </Tabs>
  );
}