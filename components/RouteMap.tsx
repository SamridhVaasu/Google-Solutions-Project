"use client";

import { useState, useEffect } from "react";
import { useCargoStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { geocodeAddress, fleetPlanner } from "@/lib/maps-api";
import dynamic from 'next/dynamic';

// Import MapRenderer component with no SSR
const MapRenderer = dynamic(() => import('@/components/MapRenderer'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function RouteMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.61648476788898, 12.931423492103944]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isMounted, setIsMounted] = useState(false);
  const { selectedVehicle, cargos } = useCargoStore();

  // Only run on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculateRoutes = async () => {
    if (!origin || !destination) {
      toast({ title: "Error", description: "Both origin and destination are required", variant: "destructive" });
      return;
    }

    setIsCalculating(true);

    try {
      // Geocode origin and destination
      const originCoords = await geocodeAddress(origin);
      const destinationCoords = await geocodeAddress(destination);

      if (!originCoords || !destinationCoords) {
        throw new Error("Failed to geocode addresses");
      }

      // Update the map center to the midpoint of the route
      setMapCenter([
        (originCoords.lat + destinationCoords.lat) / 2,
        (originCoords.lng + destinationCoords.lng) / 2,
      ]);

      // Prepare data for Fleet Planner API
      const fleetPlannerData = {
        packages: cargos.map((cargo) => ({
          id: cargo.id,
          weightInGrams: cargo.weight * 1000,
          loadingLocation: originCoords,
          unloadingLocation: destinationCoords,
        })),
        vehicles: [
          {
            id: selectedVehicle?.id || "default-vehicle",
            capacityInKG: selectedVehicle?.maxWeight || 1000,
            startTime: { hour: 8, minutes: 0 },
            endTime: { hour: 18, minutes: 0 },
          },
        ],
      };

      const fleetPlannerResponse = await fleetPlanner(fleetPlannerData);

      // Update routes
      setRoutes(fleetPlannerResponse.routes);

      toast({ title: "Success", description: "Routes calculated successfully", variant: "default" });
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error calculating routes",
        description: "Please try again with valid addresses",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="h-96 bg-gray-100"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="Origin Address"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Destination Address"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={calculateRoutes}
        disabled={!origin || !destination || isCalculating}
      >
        {isCalculating ? "Calculating..." : "Calculate Routes"}
      </Button>

      {routes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Optimized Routes</h3>
          <ul>
            {routes.map((route, index) => (
              <li key={index}>
                Vehicle {route.vehicleId}: {route.waypoints.map((wp) => `(${wp.location.lat}, ${wp.location.lng})`).join(" -> ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 h-96 border rounded-lg overflow-hidden">
        <MapRenderer center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}