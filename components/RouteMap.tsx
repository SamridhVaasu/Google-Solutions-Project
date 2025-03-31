"use client";

import { useEffect, useState } from "react";
import { useCargoStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getDirections } from "@/lib/maps-api";

export default function RouteMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const { selectedVehicle, setRoutes } = useCargoStore();

  const calculateRoute = async () => {
    if (!origin || !destination) return;
    setIsCalculating(true);

    try {
      const result = await getDirections(origin, destination);
      const route = result.routes[0];

      if (selectedVehicle && route) {
        const response = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${origin} to ${destination}`,
            startPoint: { 
              lat: route.bounds.northeast.lat, 
              lng: route.bounds.northeast.lng 
            },
            endPoint: { 
              lat: route.bounds.southwest.lat, 
              lng: route.bounds.southwest.lng 
            },
            distance: route.distance,
            duration: route.duration,
            vehicleId: selectedVehicle.id,
            emissions: calculateEmissions(route.distance),
          }),
        });

        if (!response.ok) throw new Error("Failed to save route");
        
        const savedRoute = await response.json();
        setRoutes([savedRoute]);
        setRouteData(route);
        toast({
          title: "Route calculated successfully",
          description: `Distance: ${route.distance}m, Duration: ${route.duration}s`,
        });
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error calculating route",
        description: "Please try again with valid locations",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateEmissions = (distance: number) => {
    const emissionsFactor = 120; // Example factor
    return (distance / 1000) * emissionsFactor;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </div>

      <Button 
        onClick={calculateRoute} 
        disabled={!origin || !destination || isCalculating}
      >
        {isCalculating ? "Calculating..." : "Calculate Route"}
      </Button>

      {routeData && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Route Details</h3>
          <p>Distance: {routeData.distance} meters</p>
          <p>Duration: {routeData.duration} seconds</p>
        </div>
      )}
    </div>
  );
}