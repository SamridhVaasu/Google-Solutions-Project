"use client";

import { useState, useEffect } from "react";
import { useCargoStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { geocodeAddress, fleetPlanner, FleetPlannerRequest, FleetPlannerResponse, getCurrentPosition } from "@/lib/maps-api";
import dynamic from 'next/dynamic';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Import MapRenderer component with no SSR
const MapRenderer = dynamic(() => import('@/components/MapRenderer'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function RouteMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [routes, setRoutes] = useState<FleetPlannerResponse["routes"]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.61648476788898, 12.931423492103944]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isMounted, setIsMounted] = useState(false);
  const [useTimeConstraints, setUseTimeConstraints] = useState(false);
  const [startTime, setStartTime] = useState({ hour: 8, minutes: 0 });
  const [endTime, setEndTime] = useState({ hour: 18, minutes: 0 });
  const [useCommonPickupPoint, setUseCommonPickupPoint] = useState(true);
  const [useCommonDropoffPoint, setUseCommonDropoffPoint] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState<'origin' | 'destination' | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { selectedVehicle, cargos } = useCargoStore();

  // Only run on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to handle finding current location
  const handleGetCurrentLocation = async (locationType: 'origin' | 'destination') => {
    try {
      setIsGettingLocation(locationType);
      setDebugInfo(null);
      
      // Get current position
      const position = await getCurrentPosition();
      if (!position) {
        throw new Error("Could not get current position");
      }
      
      // Format as coordinate string
      const locationString = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
      
      if (locationType === 'origin') {
        setOrigin(locationString);
        toast({ title: "Success", description: "Set origin to current location", variant: "default" });
      } else {
        setDestination(locationString);
        toast({ title: "Success", description: "Set destination to current location", variant: "default" });
      }
      
      // Update map center
      setMapCenter([position.lat, position.lng]);
      setMapZoom(15); // Zoom in to show the current location
      
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({ 
        title: "Error", 
        description: "Failed to get your current location. Please ensure location access is enabled.",
        variant: "destructive" 
      });
    } finally {
      setIsGettingLocation(null);
    }
  };

  // Handle location found from map
  const handleLocationFound = (location: { lat: number; lng: number }) => {
    const locationString = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
    
    // If we're actively trying to get location for origin or destination, set it
    if (isGettingLocation === 'origin') {
      setOrigin(locationString);
      toast({ title: "Success", description: "Set origin to current location", variant: "default" });
    } else if (isGettingLocation === 'destination') {
      setDestination(locationString);
      toast({ title: "Success", description: "Set destination to current location", variant: "default" });
    }
    
    // Reset the state
    setIsGettingLocation(null);
  };

  const calculateRoutes = async () => {
    if (!origin) {
      toast({ title: "Error", description: "Origin address is required", variant: "destructive" });
      return;
    }

    if (useCommonDropoffPoint && !destination) {
      toast({ title: "Error", description: "Destination address is required", variant: "destructive" });
      return;
    }

    setIsCalculating(true);
    setDebugInfo(null);

    try {
      // Geocode origin
      let originCoords;
      try {
        originCoords = await geocodeAddress(origin);
        if (!originCoords) {
          throw new Error("Could not geocode origin address. Please try a different address or format.");
        }
      } catch (error) {
        console.error("Origin geocoding error:", error);
        throw new Error(`Origin geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      
      // Geocode destination if needed
      let destinationCoords = null;
      if (useCommonDropoffPoint && destination) {
        try {
          destinationCoords = await geocodeAddress(destination);
          if (!destinationCoords) {
            throw new Error("Could not geocode destination address. Please try a different address or format.");
          }
        } catch (error) {
          console.error("Destination geocoding error:", error);
          throw new Error(`Destination geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Update the map center to origin for now
      setMapCenter([originCoords.lat, originCoords.lng]);

      // Prepare data for Fleet Planner API
      if (!selectedVehicle) {
        throw new Error("No vehicle selected. Please select a vehicle first.");
      }

      if (cargos.length === 0) {
        throw new Error("No cargo items. Please add cargo items first.");
      }

      // Set debug info to help diagnose issues
      setDebugInfo(`Using vehicle: ${selectedVehicle.id}, Capacity: ${selectedVehicle.maxWeight}kg, Cargo count: ${cargos.length}`);
      
      const fleetPlannerData: FleetPlannerRequest = {
        packages: cargos.map((cargo) => {
          const packageData: any = {
            id: cargo.id,
            weightInGrams: Math.round(cargo.weight * 1000), // Convert kg to grams
            loadingTimeInMinutes: 5, // Default loading time
          };

          // Set loading location
          if (useCommonPickupPoint) {
            packageData.loadingLocation = originCoords;
          } else {
            // If not using common pickup, use origin as default
            packageData.loadingLocation = originCoords;
          }

          // Set unloading location
          if (useCommonDropoffPoint && destinationCoords) {
            packageData.unloadingLocation = destinationCoords;
            packageData.unloadingTimeInMinutes = 5; // Default unloading time
          }

          return packageData;
        }),
        vehicles: [
          {
            id: selectedVehicle.id,
            capacityInKG: Math.max(selectedVehicle.maxWeight || 1000, 10), // Ensure minimum capacity of 10kg
            ...(useTimeConstraints && {
              startTime,
              endTime
            }),
            startLocation: originCoords
          },
        ],
        globalStartLocation: originCoords
      };

      // Call the Fleet Planner API
      const fleetPlannerResponse = await fleetPlanner(fleetPlannerData);

      // Update routes
      setRoutes(fleetPlannerResponse.routes);
      setDebugInfo(`Route calculated successfully. ${fleetPlannerResponse.routes.length} routes found.`);

      // If we have routes, update the map center to better show the route
      if (fleetPlannerResponse.routes.length > 0 && fleetPlannerResponse.routes[0].waypoints.length > 1) {
        const waypoints = fleetPlannerResponse.routes[0].waypoints;
        const middleWaypoint = waypoints[Math.floor(waypoints.length / 2)];
        setMapCenter([middleWaypoint.location.lat, middleWaypoint.location.lng]);
        
        // Adjust zoom based on route length
        if (fleetPlannerResponse.routes[0].summary) {
          const distance = fleetPlannerResponse.routes[0].summary.distance;
          if (distance < 1000) setMapZoom(15);
          else if (distance < 5000) setMapZoom(13);
          else if (distance < 20000) setMapZoom(11);
          else setMapZoom(9);
        }
      }

      toast({ title: "Success", description: "Routes calculated successfully", variant: "default" });
    } catch (error) {
      console.error("Route calculation error:", error);
      
      // Set detailed debug info on error
      setDebugInfo(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      toast({
        title: "Error calculating route",
        description: error instanceof Error ? error.message : "Please try again with valid addresses",
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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <h2 className="text-lg font-medium mb-3">Route Planning Settings</h2>
        
        {debugInfo && (
          <Alert className="mb-4" variant={debugInfo.includes("Error") ? "destructive" : "default"}>
            <AlertTitle>Debug Information</AlertTitle>
            <AlertDescription className="font-mono text-xs">{debugInfo}</AlertDescription>
          </Alert>
        )}
        
        {/* Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="origin">Origin Address or Coordinates</Label>
            <div className="flex gap-2">
              <Input
                id="origin"
                placeholder="Address or lat,lng"
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
            <p className="text-xs text-muted-foreground mt-1">
              Enter an address or coordinates in format: lat,lng
            </p>
          </div>
          
          {useCommonDropoffPoint && (
            <div>
              <Label htmlFor="destination">Destination Address or Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  id="destination"
                  placeholder="Address or lat,lng"
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
              <p className="text-xs text-muted-foreground mt-1">
                Enter an address or coordinates in format: lat,lng
              </p>
            </div>
          )}
        </div>
        
        {/* Route Options */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="time-constraints"
              checked={useTimeConstraints}
              onCheckedChange={setUseTimeConstraints}
            />
            <Label htmlFor="time-constraints">Use time constraints</Label>
          </div>
          
          {useTimeConstraints && (
            <div className="grid grid-cols-2 gap-4 pl-6 mt-2">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="start-time-hour"
                    type="number"
                    min="0"
                    max="23"
                    value={startTime.hour}
                    onChange={(e) => setStartTime({ ...startTime, hour: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <span className="self-center">:</span>
                  <Input
                    id="start-time-min"
                    type="number"
                    min="0"
                    max="59"
                    value={startTime.minutes}
                    onChange={(e) => setStartTime({ ...startTime, minutes: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="end-time-hour"
                    type="number"
                    min="0"
                    max="23"
                    value={endTime.hour}
                    onChange={(e) => setEndTime({ ...endTime, hour: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <span className="self-center">:</span>
                  <Input
                    id="end-time-min"
                    type="number"
                    min="0"
                    max="59"
                    value={endTime.minutes}
                    onChange={(e) => setEndTime({ ...endTime, minutes: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="common-pickup"
              checked={useCommonPickupPoint}
              onCheckedChange={(checked) => setUseCommonPickupPoint(checked === true)}
            />
            <Label htmlFor="common-pickup">Use common pickup point for all cargos</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="common-dropoff"
              checked={useCommonDropoffPoint}
              onCheckedChange={(checked) => {
                setUseCommonDropoffPoint(checked === true);
                if (!checked) {
                  setDestination("");
                }
              }}
            />
            <Label htmlFor="common-dropoff">Use common delivery point for all cargos</Label>
          </div>
        </div>
        
        <Button
          onClick={calculateRoutes}
          disabled={!origin || (useCommonDropoffPoint && !destination) || isCalculating}
          className="w-full"
        >
          {isCalculating ? (
            <span className="flex items-center">
              <span className="mr-2">Calculating...</span>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
            </span>
          ) : "Calculate Route"}
        </Button>
      </div>

      {routes.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-3">Optimized Routes</h3>
          {routes.map((route, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <h4 className="font-medium">Vehicle: {route.vehicleId}</h4>
              {route.summary && (
                <div className="text-sm text-gray-500 mb-2">
                  Distance: {(route.summary.distance/1000).toFixed(2)} km | 
                  Duration: {Math.floor(route.summary.duration/60)} mins
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded text-sm">
                <ol className="list-decimal pl-5">
                  {route.waypoints.map((waypoint, waypointIndex) => (
                    <li key={waypointIndex} className="mb-1">
                      {waypoint.packageId ? (
                        <span>
                          <span className="font-medium">{waypoint.type === "pickup" ? "Pickup" : "Delivery"}</span> package{' '}
                          <span className="font-mono bg-blue-100 px-1 rounded">{waypoint.packageId.substring(0, 6)}...</span>{' '}
                          at ({waypoint.location.lat.toFixed(5)}, {waypoint.location.lng.toFixed(5)})
                        </span>
                      ) : (
                        <span>
                          Stop at ({waypoint.location.lat.toFixed(5)}, {waypoint.location.lng.toFixed(5)})
                        </span>
                      )}
                      {waypoint.arrivalTime && (
                        <span className="text-gray-500 ml-2">
                          Arrival: {new Date(waypoint.arrivalTime).toLocaleTimeString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 h-96 border rounded-lg overflow-hidden">
        <MapRenderer 
          center={mapCenter} 
          zoom={mapZoom} 
          routes={routes}
          onLocationFound={handleLocationFound}
        />
      </div>
    </div>
  );
}