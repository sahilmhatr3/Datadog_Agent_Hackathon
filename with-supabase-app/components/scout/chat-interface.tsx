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
  recommendations?: Recommendation[];
}

interface Recommendation {
  id: string;
  name: string;
  category: string;
  description: string;
  score: number;
  reasons: any;
  address: string;
  price: string;
  tags: string[];
  amenities: string[];
  url?: string;
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
      
      // Process initial query
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/scout-process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              query: initialQuery,
              sessionId: sessionId 
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            let aiContent = `I found some great options based on: "${initialQuery}".\n\n`;
            if (data.recommendations && data.recommendations.length > 0) {
              aiContent += "Here are my top recommendations:";
            } else {
              aiContent += "What specific preferences do you have? (cuisine, budget, vibes, atmosphere, dietary restrictions, etc.)";
            }
            
            const aiResponse: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: aiContent,
              timestamp: new Date(),
              recommendations: data.recommendations || []
            };
            setMessages((prev) => [...prev, aiResponse]);
          } else {
            const aiResponse: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Great! I can help you plan your trip based on: "${initialQuery}". What specific preferences do you have? (cuisine, budget, vibes, etc.)`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
          }
        } catch (error) {
          console.error('Error processing initial query:', error);
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Great! I can help you plan your trip based on: "${initialQuery}". What specific preferences do you have? (cuisine, budget, vibes, etc.)`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiResponse]);
        } finally {
          setIsLoading(false);
        }
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
      // Call the Scout process API
      const response = await fetch('/api/scout-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: trimmedInput,
          sessionId: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Scout API response:', data);
      console.log('Recommendations:', data.recommendations);
      
      // Create AI response with recommendations
      let aiContent = "Based on your preferences, here are my recommendations:\n\n";
      
      if (data.recommendations && data.recommendations.length > 0) {
        // Add text summary
        console.log('First recommendation:', data.recommendations[0]);
        aiContent += data.recommendations.slice(0, 5).map((rec: Recommendation, index: number) => {
          console.log(`Recommendation ${index}:`, rec);
          const name = rec.name || `Place ${index + 1}`;
          const desc = rec.description || 'Great dining option';
          return `${index + 1}. **${name}** - ${rec.category || 'restaurant'}\n   ${desc.slice(0, 100)}...\n   Price: ${rec.price || '$$'} | Score: ${rec.score || 80}/100`;
        }).join('\n\n');
      } else {
        aiContent = "I couldn't find specific recommendations based on your query. Could you provide more details about what you're looking for?";
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
        recommendations: data.recommendations || []
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
                                <div className="text-sm whitespace-pre-wrap">
                                    {message.content.split('\n').map((line, idx) => {
                                        // Parse basic markdown: **bold**
                                        const parsedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        return (
                                            <div key={idx} dangerouslySetInnerHTML={{ __html: parsedLine }} />
                                        );
                                    })}
                                </div>
                                
                                {/* Display recommendations as cards */}
                                {message.recommendations && message.recommendations.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {message.recommendations.slice(0, 5).map((rec) => (
                                            <Card key={rec.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-base">{rec.name || 'Restaurant Name'}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {rec.category || 'restaurant'} • {rec.price || '$$'} • Score: {rec.score || 80}/100
                                                        </p>
                                                        <p className="text-sm mt-2 line-clamp-2">{rec.description || 'A great place to dine with romantic ambiance.'}</p>
                                                        {rec.address && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                📍 {rec.address}
                                                            </p>
                                                        )}
                                                        {rec.tags.length > 0 && (
                                                            <div className="flex gap-1 mt-2">
                                                                {rec.tags.map((tag) => (
                                                                    <span key={tag} className="px-2 py-1 bg-primary/10 text-xs rounded-full">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {rec.url && (
                                                        <a 
                                                            href={rec.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="ml-4 text-primary hover:text-primary/80"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
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