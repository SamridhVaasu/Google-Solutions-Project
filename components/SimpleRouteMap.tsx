"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { geocodeAddress, getOptimizedRoute } from "@/lib/maps-api";
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { Label } from "@/components/ui/label";

// Import MapRenderer component with no SSR
const MapRenderer = dynamic(() => import('@/components/MapRenderer'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function SimpleRouteMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.61648476788898, 12.931423492103944]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isMounted, setIsMounted] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState<'origin' | 'destination' | null>(null);
  
  // Only run on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to handle finding current location
  const handleGetCurrentLocation = async (locationType: 'origin' | 'destination') => {
    try {
      setIsGettingLocation(locationType);
      
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationString = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          
          if (locationType === 'origin') {
            setOrigin(locationString);
            toast({ title: "Success", description: "Set origin to current location", variant: "default" });
          } else {
            setDestination(locationString);
            toast({ title: "Success", description: "Set destination to current location", variant: "default" });
          }
          
          // Update map center
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(15); // Zoom in to show the current location
          
          setIsGettingLocation(null);
        },
        (error) => {
          console.error("Error getting current position:", error);
          toast({ 
            title: "Error", 
            description: "Failed to get your location. Please ensure location access is enabled.",
            variant: "destructive" 
          });
          setIsGettingLocation(null);
        }
      );
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({ 
        title: "Error", 
        description: "Failed to get your location. Please ensure location access is enabled.",
        variant: "destructive" 
      });
      setIsGettingLocation(null);
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast({ title: "Error", description: "Both source and destination addresses are required", variant: "destructive" });
      return;
    }

    setIsCalculating(true);

    try {
      // Geocode origin and destination
      let originCoords;
      let destinationCoords;
      
      // Check if origin is already coordinates
      if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(origin.trim())) {
        const [lat, lng] = origin.split(',').map(coord => parseFloat(coord.trim()));
        originCoords = { lat, lng };
      } else {
        originCoords = await geocodeAddress(origin);
        if (!originCoords) {
          throw new Error("Could not geocode source address");
        }
      }
      
      // Check if destination is already coordinates
      if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(destination.trim())) {
        const [lat, lng] = destination.split(',').map(coord => parseFloat(coord.trim()));
        destinationCoords = { lat, lng };
      } else {
        destinationCoords = await geocodeAddress(destination);
        if (!destinationCoords) {
          throw new Error("Could not geocode destination address");
        }
      }

      // Get route using the Route Optimizer API
      const routeResponse = await getOptimizedRoute([originCoords, destinationCoords]);
      setRouteData(routeResponse);

      // Center map between origin and destination
      setMapCenter([
        (originCoords.lat + destinationCoords.lat) / 2,
        (originCoords.lng + destinationCoords.lng) / 2,
      ]);
      
      // Adjust zoom level based on distance
      const distance = routeResponse.routes[0].distance;
      if (distance < 1000) { // Less than 1km
        setMapZoom(15);
      } else if (distance < 5000) { // Less than 5km
        setMapZoom(13);
      } else if (distance < 20000) { // Less than 20km
        setMapZoom(11);
      } else {
        setMapZoom(10);
      }

      toast({ title: "Success", description: "Route calculated successfully", variant: "default" });
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error calculating route",
        description: error instanceof Error ? error.message : "Please try again with valid addresses",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Format the route data for display
  const formatRouteDisplay = () => {
    if (!routeData || !routeData.routes || routeData.routes.length === 0) {
      return null;
    }

    const route = routeData.routes[0];
    const distance = (route.distance / 1000).toFixed(2); // Convert to km
    const duration = Math.round(route.duration / 60); // Convert to minutes

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-2">Route Summary</h3>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <div>Distance: <span className="font-medium">{distance} km</span></div>
          <div>Duration: <span className="font-medium">{duration} mins</span></div>
        </div>
        
        {route.legs && route.legs.length > 0 && route.legs[0].steps && (
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Directions:</h4>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              {route.legs[0].steps.map((step, index) => (
                <li key={index}>
                  <div className="font-medium">{step.instruction || step.name}</div>
                  <div className="text-xs text-gray-500">
                    {(step.distance / 1000).toFixed(2)} km · {Math.round(step.duration / 60)} mins
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  // Format the route data for the map
  const formatRouteForMap = () => {
    if (!routeData || !routeData.routes || routeData.routes.length === 0) {
      return [];
    }

    // Convert to the format expected by the map component
    return [{
      vehicleId: "route",
      waypoints: routeData.routes[0].geometry.coordinates.map((coord: [number, number], index: number) => ({
        location: { lat: coord[1], lng: coord[0] },
        sequence: index
      })),
      summary: {
        distance: routeData.routes[0].distance,
        duration: routeData.routes[0].duration
      }
    }];
  };

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="h-96 bg-gray-100"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <h2 className="text-lg font-medium mb-3">Simple Route Planner</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="origin">Source Address</Label>
            <div className="flex gap-2">
              <Input
                id="origin"
                placeholder="Enter source address"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleGetCurrentLocation('origin')}
                disabled={isGettingLocation !== null}
              >
                {isGettingLocation === 'origin' ? (
                  <span className="animate-ping h-2 w-2 rounded-full bg-blue-600 opacity-75"></span>
                ) : (
                  <MapPin size={18} />
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="destination">Destination Address</Label>
            <div className="flex gap-2">
              <Input
                id="destination"
                placeholder="Enter destination address"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleGetCurrentLocation('destination')}
                disabled={isGettingLocation !== null}
              >
                {isGettingLocation === 'destination' ? (
                  <span className="animate-ping h-2 w-2 rounded-full bg-blue-600 opacity-75"></span>
                ) : (
                  <MapPin size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <Button
          onClick={calculateRoute}
          disabled={!origin || !destination || isCalculating}
          className="w-full"
        >
          {isCalculating ? "Calculating..." : "Calculate Route"}
        </Button>
      </div>

      {formatRouteDisplay()}

      <div className="mt-4 h-96 border rounded-lg overflow-hidden">
        <MapRenderer 
          center={mapCenter} 
          zoom={mapZoom} 
          routes={formatRouteForMap()}
        />
      </div>
    </div>
  );
}
