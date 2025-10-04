// components/RoutePicker.tsx

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { List, MoveRight, Utensils, GlassWater, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Route } from "./MapView"; // Assuming Route is imported/defined here

interface RoutePickerProps {
    routes: Route[];
    selectedRouteId: string | null;
    onSelectRoute: (routeId: string) => void;
}

export function RoutePicker({ routes, selectedRouteId, onSelectRoute }: RoutePickerProps) {
    if (routes.length === 0) return null;

    return (
        <div className="space-y-4 p-4 border-b">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Navigation className="h-5 w-5 text-primary" />
                Suggested Routes
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {routes.map((route) => {
                    const isSelected = route.route_id === selectedRouteId;
                    const thaiStop = route.stops.find(s => s.category === "Thai Dinner");
                    const barStop = route.stops.find(s => s.category === "Drinks");

                    return (
                        <Card
                            key={route.route_id}
                            className={cn(
                                "p-4 cursor-pointer transition-all duration-200 border-2",
                                isSelected ? "border-primary shadow-lg ring-4 ring-primary/20" : "hover:border-primary/50"
                            )}
                            onClick={() => onSelectRoute(route.route_id)}
                        >
                            <h5 className="font-bold text-base mb-2">{route.description.split(": ")[0]}</h5>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Utensils className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <span className="font-medium text-foreground line-clamp-1">Thai:</span>
                                    <span className="line-clamp-1">{thaiStop?.address.split(',')[0]}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GlassWater className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="font-medium text-foreground line-clamp-1">Bar:</span>
                                    <span className="line-clamp-1">{barStop?.address.split(',')[0]}</span>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                className="w-full mt-4" 
                                variant={isSelected ? "default" : "outline"}
                            >
                                {isSelected ? "Selected Route" : "Select Route"}
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}