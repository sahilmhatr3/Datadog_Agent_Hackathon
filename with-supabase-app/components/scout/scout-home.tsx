"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "./search-bar";
import { MapView } from "./map-view";
import { ChatInterface } from "./chat-interface";
import { PreviousSessions } from "./previous-sessions";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScoutHome() {
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  }>({});

  useEffect(() => {
    // Mock user location detection (in production, use geolocation API)
    setTimeout(() => {
      setUserLocation({
        city: "San Francisco",
        country: "USA",
        lat: 37.7749,
        lng: -122.4194,
      });
    }, 1000);
  }, []);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setCurrentQuery(query);
    // Mock session creation
    setSessionId(`session-${Date.now()}`);
  };

  const handleBackToSearch = () => {
    setIsSearching(false);
    setCurrentQuery("");
    setSessionId("");
  };

  const handleSessionClick = (sessionId: string) => {
    // In production, load the session details
    console.log("Loading session:", sessionId);
  };

  if (isSearching) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={handleBackToSearch}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          New Search
        </Button>
        <ChatInterface initialQuery={currentQuery} sessionId={sessionId} />
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

