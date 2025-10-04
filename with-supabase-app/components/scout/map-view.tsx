"use client";

import { MapPin, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MapViewProps {
  userLocation?: {
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
}

export function MapView({ userLocation }: MapViewProps) {
  return (
    <Card className="w-full h-[300px] relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      {/* Mock map background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-blue-300 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-indigo-300 blur-3xl" />
      </div>

      {/* Map grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* User location marker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-8 bg-primary/20 rounded-full animate-ping" />
          <div className="relative bg-primary text-primary-foreground p-4 rounded-full shadow-lg">
            <Navigation className="h-6 w-6" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Location label */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {userLocation.city
              ? `${userLocation.city}, ${userLocation.country}`
              : "Detecting location..."}
          </span>
        </div>
      )}

      {/* Map info overlay */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
        <span className="text-xs font-medium text-muted-foreground">
          Interactive map coming soon
        </span>
      </div>
    </Card>
  );
}

