// components/MapView.tsx (Full updated file)

"use client";

import { MapPin, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Route and Location Interfaces ---
type MapLocationSource = "user" | "mention";

interface MapLocation {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  label?: string;
  source?: MapLocationSource;
}

interface RouteStop {
    stop_name: string;
    address: string;
    category: string;
}

export interface Route {
    route_id: string;
    description: string;
    stops: RouteStop[];
}

// --- MapView Props and Component ---
interface MapViewProps {
  userLocation?: MapLocation;
  focusedLocation?: MapLocation;
  activeRoute?: Route; 
  className?: string;
}

// --- API Key Configuration ---
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function MapView({
  userLocation,
  focusedLocation,
  activeRoute,
  className,
}: MapViewProps) {
  const isRouting = !!activeRoute;
  const activeLocation = focusedLocation ?? userLocation;
  
  const locationLabel =
    activeLocation?.label ??
    [activeLocation?.city, activeLocation?.country].filter(Boolean).join(", ") ||
    undefined;

  const mapQuery = locationLabel 
    ? encodeURIComponent(locationLabel) 
    : (activeLocation?.lat && activeLocation?.lng 
        ? `${activeLocation.lat},${activeLocation.lng}` 
        : "New York, NY");
  
  let statusBadge: string;
  let subtitle: string;
  let mapSrc: string;

  if (!MAPS_API_KEY) {
      statusBadge = "API KEY MISSING";
      subtitle = "Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.";
      mapSrc = ""; 
  }
  else if (isRouting && activeRoute) {
    const stops = activeRoute.stops;
    const origin = encodeURIComponent(stops[0].address);
    const destination = encodeURIComponent(stops[stops.length - 1].address);
    
    const waypoints = stops
      .slice(1, stops.length - 1)
      .map(stop => encodeURIComponent(stop.address))
      .join('|');

    // Multi-stop Directions Mode with the actual key
    mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${origin}&destination=${destination}&waypoints=${waypoints}&mode=walking`;
    
    statusBadge = "SELECTED ROUTE";
    subtitle = activeRoute.description;
    
  } else {
    // Single Location View Mode with the actual key
    const center = (activeLocation?.lat && activeLocation?.lng)
        ? `${activeLocation.lat},${activeLocation.lng}`
        : mapQuery;
        
    mapSrc = `https://www.google.com/maps/embed/v1/view?key=${MAPS_API_KEY}&center=${center}&zoom=14`;
    
    statusBadge = "CURRENT LOCATION";
    subtitle = userLocation
    ? "Centered on your current location"
    : "We'll center the map once a location is available";
  }


  return (
    <Card
      className={cn(
        "relative w-full h-full overflow-hidden p-0", // Changed h-[300px] to h-full
        className,
      )}
    >
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSrc}
        title={isRouting ? `Route ${activeRoute?.route_id}` : "Interactive Map View"}
      ></iframe>

      {/* Location label overlay */}
      <div className="absolute bottom-4 left-4 min-w-[220px] rounded-2xl bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Navigation className="h-3.5 w-3.5 text-primary" />
          {statusBadge}
        </div>
        <span className="text-sm font-semibold text-foreground line-clamp-1">
          {isRouting ? activeRoute?.stops[0].address : (locationLabel ?? "Detecting location...")}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-1">
            {subtitle}
        </span>
      </div>

      {/* Map info overlay */}
      <div className="absolute top-4 right-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm z-10">
        Recommendations will appear here soon
      </div>
    </Card>
  );
}