"use client";

import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MapLocationSource = "user" | "mention";

interface MapLocation {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  label?: string;
  source?: MapLocationSource;
}

interface MapViewProps {
  userLocation?: MapLocation;
  focusedLocation?: MapLocation;
  className?: string;
}

export function MapView({
  userLocation,
  focusedLocation,
  className,
}: MapViewProps) {
  const activeLocation = focusedLocation ?? userLocation;
  const isChatLocation =
    (focusedLocation?.source ?? activeLocation?.source) === "mention";
  
  const locationLabel =
    activeLocation?.label ??
    [activeLocation?.city, activeLocation?.country].filter(Boolean).join(", ") ||
    undefined;

  const mapQuery = locationLabel 
    ? encodeURIComponent(locationLabel) 
    : (activeLocation?.lat && activeLocation?.lng 
        ? `${activeLocation.lat},${activeLocation.lng}` 
        : "San Francisco, CA");
  
  const statusBadge = isChatLocation ? "Chat destination" : "Current location";
  const subtitle = isChatLocation
    ? "Showing the place mentioned in chat"
    : userLocation
    ? "Centered on your current location"
    : "We'll center the map once a location is available";

  const mapSrc = `https://maps.google.com/maps?q=$&q=${mapQuery}&output=embed&z=12`;

  return (
    <Card
      className={cn(
        "relative w-full h-[300px] overflow-hidden p-0",
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
        title="Interactive Map View"
      ></iframe>

      {/* Location label overlay */}
      <div className="absolute bottom-4 left-4 min-w-[220px] rounded-2xl bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {statusBadge}
        </div>
        <span className="text-sm font-semibold text-foreground line-clamp-1">
          {locationLabel ?? "Detecting location..."}
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