// components/ChatInterface.tsx (Updated for Wider Chat)

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Assuming these are imported correctly from the file structure
import { MapView, type Route as MapRoute } from "./map-view"; 
import { RoutePicker } from "./route-picker"; 


// --- Route Data (Mocking dummy_route_data.json) ---
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

const DUMMY_ROUTES: Route[] = [
  // ... (Full DUMMY_ROUTES array)
  {
    "route_id": "route_1",
    "description": "The Uptown Route: Thai on 48th -> Bar on 9th Ave -> Residential",
    "stops": [
      {"stop_name": "Current Location (NYT Building)", "address": "620 8th Ave, New York, NY 10018", "category": "Start"},
      {"stop_name": "Thai Restaurant 1", "address": "244 W 48th St, New York, NY 10036", "category": "Thai Dinner"},
      {"stop_name": "Bar 1", "address": "576 9th Ave, New York, NY 10036", "category": "Drinks"},
      {"stop_name": "Residential Address", "address": "870 7th Ave, New York, NY 10019", "category": "End"}
    ]
  },
  {
    "route_id": "route_2",
    "description": "The Mid-Theater Route: Thai on 9th Ave -> Bar on 44th St -> Residential",
    "stops": [
      {"stop_name": "Current Location (NYT Building)", "address": "620 8th Ave, New York, NY 10018", "category": "Start"},
      {"stop_name": "Thai Restaurant 2", "address": "690 9th Ave, New York, NY 10036", "category": "Thai Dinner"},
      {"stop_name": "Bar 2", "address": "356 W 44th St, New York, NY 10036", "category": "Drinks"},
      {"stop_name": "Residential Address", "address": "870 7th Ave, New York, NY 10019", "category": "End"}
    ]
  },
  {
    "route_id": "route_3",
    "description": "The Downtown Route: Thai on 56th St -> Bar on 47th St -> Residential",
    "stops": [
      {"stop_name": "Current Location (NYT Building)", "address": "620 8th Ave, New York, NY 10018", "category": "Start"},
      {"stop_name": "Thai Restaurant 3", "address": "58 W 56th St 2nd floor, New York, NY 10019", "category": "Thai Dinner"},
      {"stop_name": "Bar 3", "address": "146 W 47th St, New York, NY 10036", "category": "Drinks"},
      {"stop_name": "Residential Address", "address": "870 7th Ave, New York, NY 10019", "category": "End"}
    ]
  }
];


// --- Chat Interface Logic ---
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialQuery: string;
  sessionId: string;
  onUserMessage?: (message: string) => void;
}

export function ChatInterface({
  initialQuery,
  sessionId,
  onUserMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>("route_1"); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive the active route from state
  const activeRoute = useMemo(() => {
    return DUMMY_ROUTES.find(r => r.route_id === selectedRouteId) || null;
  }, [selectedRouteId]);

  // Initialize with first query message
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialQuery,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      
      // Mock AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Great! I can help you plan your trip based on: "${initialQuery}". What specific preferences do you have? (cuisine, budget, vibes, etc.)`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
    }
  }, [initialQuery]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    onUserMessage?.(trimmedInput);
    setInput("");
    setIsLoading(true);

    try {
      // Call the Linkup API
      const response = await fetch('/api/linkup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedInput }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Save the Linkup response to a JSON file
      const responseData = {
        sessionId: sessionId || `session-${Date.now()}`,
        query: trimmedInput,
        response: data,
        timestamp: new Date().toISOString(),
        userMessage: userMessage
      };

      // Save to JSON file via API endpoint
      await fetch('/api/save-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });
      
      // Show a generic confirmation message instead of the actual response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've processed your request and saved the information. The response has been logged for analysis.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Linkup API:', error);
      
      // Fallback to a helpful error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble accessing my knowledge base right now. Please try again in a moment, or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    
    const selectedRoute = DUMMY_ROUTES.find(r => r.route_id === routeId);
    if (selectedRoute) {
        const confirmationMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: `I've selected route: ${selectedRoute.description}. Show me the stops!`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmationMessage]); 
    }
  };

  // --- UPDATED LAYOUT RETURN BLOCK ---
  return (
    <div className="flex flex-col lg:flex-row w-full h-full shadow-xl rounded-xl overflow-hidden bg-white">
      
      {/* LEFT COLUMN: Chat Interface and Route Picker */}
      <div className="flex flex-col w-full lg:w-1/2 h-full">{/* 50% on large screens, full width on mobile */}

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <div className="bg-primary/10 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Scout AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {sessionId
                ? `Session #${sessionId?.slice(0, 8)}`
                : "Planning your perfect itinerary"}
            </p>
          </div>
        </div>

        {/* Route Picker Area */}
        <div className="flex-shrink-0 p-4 border-b">
          <RoutePicker 
            routes={DUMMY_ROUTES} 
            selectedRouteId={selectedRouteId} 
            onSelectRoute={handleRouteSelect} 
          />
        </div>

        {/* Chat Messages and Input */}
        <Card className="flex flex-col flex-1 w-full border-t-0 rounded-none overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <div>
                            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                            <p>Start a conversation to plan your adventure</p>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                        {/* Avatar rendering logic */}
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <div
                                className={`h-full w-full flex items-center justify-center text-xs font-semibold ${
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                                }`}
                            >
                                {message.role === "user" ? "You" : "AI"}
                            </div>
                        </Avatar>
                        <div
                            className={`flex-1 ${
                            message.role === "user" ? "text-right" : "text-left"
                            }`}
                        >
                            <div
                                className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-1">
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-2xl">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="flex gap-2 p-4 border-t bg-background flex-shrink-0"
            >
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tell me more about your preferences..."
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </Card>
      </div>
      
      {/* RIGHT COLUMN: Interactive Map - Now Much Wider */}
      <div className="hidden lg:flex flex-col w-full lg:w-1/2 h-full border-l p-0">{/* 50% on large screens, hidden on mobile/tablet */}
          <MapView 
              className="h-full w-full shadow-none rounded-none"
              activeRoute={activeRoute ?? undefined}
          />
      </div>

    </div>
  );
}