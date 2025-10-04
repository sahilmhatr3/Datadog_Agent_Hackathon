"use client";

import { MapPin, Navigation } from "lucide-react";
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
  const markerPulseClass = isChatLocation ? "bg-amber-400/40" : "bg-primary/20";
  const markerColorClass = isChatLocation
    ? "bg-amber-500 text-white"
    : "bg-primary text-primary-foreground";
  const statusBadge = isChatLocation ? "Chat destination" : "Current location";
  const subtitle = isChatLocation
    ? "Showing the place mentioned in chat"
    : userLocation
    ? "Centered on your current location"
    : "We'll center the map once a location is available";

  return (
    <Card
      className={cn(
        "relative w-full h-[300px] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950",
        className,
      )}
    >
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
          <div
            className={cn(
              "absolute -inset-8 rounded-full animate-ping",
              markerPulseClass,
            )}
          />
          <div
            className={cn(
              "relative p-4 rounded-full shadow-lg",
              markerColorClass,
            )}
          >
            <Navigation className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Location label */}
      <div className="absolute bottom-4 left-4 min-w-[220px] rounded-2xl bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {statusBadge}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {locationLabel ?? "Detecting location..."}
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      {/* Map info overlay */}
      <div className="absolute top-4 right-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
        Recommendations will appear here soon
      </div>
    </Card>
  );
}
