"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "./search-bar";
import { MapView } from "./map-view";
import { ChatInterface } from "./chat-interface";
import { PreviousSessions } from "./previous-sessions";
import { SessionInvites } from "./session-invites";
import type { SessionInvitePreview } from "./session-invites";
import { InviteCollaboratorCard } from "./invite-collaborator-card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type LocationInfo = {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  label?: string;
  source?: "user" | "mention";
};

const LOCATION_STOP_WORDS = new Set([
  "weekend",
  "trip",
  "experience",
  "adventure",
  "planning",
  "plan",
  "vacation",
  "getaway",
  "romantic",
  "luxury",
  "food",
  "tour",
  "nightlife",
  "ideas",
  "guide",
  "itinerary",
  "explore",
]);

const PREPOSITION_PATTERN =
  /\b(?:in|to|for|around|near|at)\s+([A-Za-z][\w]*(?:\s+[A-Za-z][\w]*)*|[A-Z]{2,})(?=[\s,.!?]|$)/i;

const CAPITALIZED_PATTERN =
  /(?:[A-Z][\w]*|[A-Z]{2,})(?:\s+(?:[A-Z][\w]*|[A-Z]{2,}))*/g;

function sanitizeLocationCandidate(candidate: string) {
  const tokens = candidate
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean)
    .filter((token) => !LOCATION_STOP_WORDS.has(token.toLowerCase()));

  if (!tokens.length) {
    return null;
  }

  return tokens.join(" ");
}

function extractLocationFromText(text: string) {
  const cleaned = text.trim();
  if (!cleaned) {
    return null;
  }

  const prepositionMatch = cleaned.match(PREPOSITION_PATTERN);
  if (prepositionMatch) {
    const candidate = sanitizeLocationCandidate(prepositionMatch[1]);
    if (candidate) {
      return candidate;
    }
  }

  const capitalizedMatches = cleaned.match(CAPITALIZED_PATTERN);
  if (capitalizedMatches) {
    for (let i = capitalizedMatches.length - 1; i >= 0; i--) {
      const candidate = sanitizeLocationCandidate(capitalizedMatches[i]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function formatLocationLabel(location?: LocationInfo) {
  if (!location) {
    return undefined;
  }

  if (location.label) {
    return location.label;
  }

  const parts = [location.city, location.country].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

const inviteNotifications: SessionInvitePreview[] = [
  {
    id: "invite-demo-paris",
    sessionId: "session-paris-weekend",
    sessionTitle: "Paris Culinary Weekend",
    destination: "Paris, France",
    inviterName: "Mila Chen",
    inviterEmail: "mila@example.com",
    status: "pending",
    createdAt: "2025-01-12T10:00:00.000Z",
    message:
      "Need your take on which markets to roam and where to end the night — help us decide!",
    participants: [
      {
        userId: "user-mila",
        name: "Mila Chen",
        lastContributionAt: "2025-01-12T16:20:00.000Z",
        ideaSummary:
          "Prioritizing natural wine bars and a Sunday brunch spot with a skyline view.",
        topRecommendations: [
          {
            id: "rec-mila-1",
            placeName: "Septime La Cave",
            city: "11th Arr.",
            matchScore: 93,
          },
          {
            id: "rec-mila-2",
            placeName: "Hardware Société",
            city: "Montmartre",
            matchScore: 87,
          },
        ],
      },
      {
        userId: "user-alex",
        name: "Alex Rivera",
        lastContributionAt: "2025-01-12T14:05:00.000Z",
        ideaSummary:
          "Wants a patisserie crawl near Le Marais and a late-night jazz lounge near the Seine.",
        topRecommendations: [
          {
            id: "rec-alex-1",
            placeName: "Du Pain et des Idées",
            city: "Canal Saint-Martin",
            matchScore: 89,
          },
          {
            id: "rec-alex-2",
            placeName: "Le Duc des Lombards",
            city: "Les Halles",
            matchScore: 82,
          },
        ],
      },
    ],
    aggregateSummary: {
      summary:
        "Group leans toward a cozy Right Bank evening with a wine crawl, dessert sprint, and jazz wind-down by the river.",
      highlights: [
        "Natural wine crawl",
        "Patisserie sprint",
        "Late-night jazz",
      ],
    },
  },
  {
    id: "invite-demo-lisbon",
    sessionId: "session-lisbon-focus",
    sessionTitle: "Lisbon Remote Work Sprint",
    destination: "Lisbon, Portugal",
    inviterName: "Jordan Blake",
    inviterEmail: "jordan@example.com",
    status: "pending",
    createdAt: "2025-01-10T18:30:00.000Z",
    participants: [
      {
        userId: "user-jordan",
        name: "Jordan Blake",
        lastContributionAt: "2025-01-12T09:10:00.000Z",
        ideaSummary:
          "Scoping sunny cowork cafés near the river with evening tapas to celebrate finishing sprints.",
        topRecommendations: [
          {
            id: "rec-jordan-1",
            placeName: "Hello, Kristof",
            city: "Cais do Sodré",
            matchScore: 85,
          },
          {
            id: "rec-jordan-2",
            placeName: "Time Out Market Lisboa",
            city: "Mercado da Ribeira",
            matchScore: 80,
          },
        ],
      },
      {
        userId: "user-sky",
        name: "Sky Patel",
        lastContributionAt: "2025-01-11T20:45:00.000Z",
        ideaSummary:
          "Looking for miradouros for sunset breaks and a fado spot to share with the crew.",
        topRecommendations: [
          {
            id: "rec-sky-1",
            placeName: "Miradouro da Senhora do Monte",
            city: "Graça",
            matchScore: 88,
          },
          {
            id: "rec-sky-2",
            placeName: "Clube de Fado",
            city: "Alfama",
            matchScore: 83,
          },
        ],
      },
    ],
    aggregateSummary: {
      summary:
        "Team needs bright cafés for daytime focus and wants to stack tapas with sunset viewpoints plus a fado night treat.",
      highlights: [
        "Cowork cafés",
        "Tapas wind-down",
        "Sunset + fado combo",
      ],
    },
  },
];

export function ScoutHome() {
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [userLocation, setUserLocation] = useState<LocationInfo>();
  const [mapLocation, setMapLocation] = useState<LocationInfo>();

  useEffect(() => {
    // Mock user location detection (in production, use geolocation API)
    const timeout = setTimeout(() => {
      const detectedLocation: LocationInfo = {
        city: "San Francisco",
        country: "USA",
        lat: 37.7749,
        lng: -122.4194,
        label: "San Francisco, USA",
        source: "user",
      };

      setUserLocation(detectedLocation);
      setMapLocation((current) =>
        current && current.source === "mention" ? current : detectedLocation,
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setCurrentQuery(query);
    // Mock session creation
    setSessionId(`session-${Date.now()}`);

    const trimmedQuery = query.trim();
    const extracted = extractLocationFromText(trimmedQuery);

    if (extracted) {
      setMapLocation({ label: extracted, source: "mention" });
    } else if (trimmedQuery && trimmedQuery.length <= 60) {
      setMapLocation({ label: trimmedQuery, source: "mention" });
    } else if (userLocation) {
      setMapLocation(userLocation);
    }
  };

  const handleBackToSearch = () => {
    setIsSearching(false);
    setCurrentQuery("");
    setSessionId("");
    setMapLocation(userLocation);
  };

  const handleSessionClick = (sessionId: string) => {
    // In production, load the session details
    console.log("Loading session:", sessionId);
  };

  const handleUserMessageLocation = useCallback((message: string) => {
    const extracted = extractLocationFromText(message);
    if (!extracted) {
      return;
    }

    setMapLocation({ label: extracted, source: "mention" });
  }, []);

  if (isSearching) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" onClick={handleBackToSearch} className="w-max">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Search
          </Button>
          {formatLocationLabel(mapLocation ?? userLocation) && (
            <p className="text-sm text-muted-foreground">
              Map is centered on{" "}
              <span className="font-medium">
                {formatLocationLabel(mapLocation ?? userLocation)}
              </span>
              .
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ChatInterface
              initialQuery={currentQuery}
              sessionId={sessionId}
              onUserMessage={handleUserMessageLocation}
            />
          </div>
          <div className="space-y-4 xl:col-span-2">
            <InviteCollaboratorCard
              sessionId={sessionId}
              currentQuery={currentQuery}
            />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Destination Map</h2>
              <p className="text-sm text-muted-foreground">
                Scout will drop recommended spots for this area as your chat
                unfolds.
              </p>
            </div>
            <MapView
              className="h-[300px] xl:h-[600px]"
              userLocation={userLocation}
              focusedLocation={mapLocation ?? userLocation}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          AI-Powered Itinerary Planning
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Where would you like to{" "}
          <span className="text-primary">explore</span>?
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tell Scout where you want to go, and I&apos;ll help you discover amazing
          places tailored to your preferences.
        </p>
      </div>

      {/* Collaboration Invites */}
      <SessionInvites invites={inviteNotifications} />

      {/* Search Bar */}
      <div className="py-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Map and Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8">
        {/* Map Section - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Your Location</h2>
          </div>
          <MapView userLocation={userLocation} />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                12
              </div>
              <div className="text-sm text-muted-foreground">
                Sessions Created
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                48
              </div>
              <div className="text-sm text-muted-foreground">
                Places Saved
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                5
              </div>
              <div className="text-sm text-muted-foreground">
                Cities Explored
              </div>
            </div>
          </div>
        </div>

        {/* Previous Sessions - Takes 1 column */}
        <div className="space-y-4">
          <PreviousSessions onSessionClick={handleSessionClick} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Weekend in NYC",
            "Romantic Paris getaway",
            "Tokyo food tour",
            "Barcelona nightlife",
            "London museums",
            "Dubai luxury experience",
          ].map((tag) => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              onClick={() => handleSearch(tag)}
              className="rounded-full"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
