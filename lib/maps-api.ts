interface RouteResponse {
  routes: Array<{
    distance: number;
    duration: number;
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    legs: Array<{
      steps: Array<{
        distance: number;
        duration: number;
        instructions: string;
        path: Array<[number, number]>;
      }>;
    }>;
  }>;
}

export interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

// Updated Fleet Planner interfaces based on the schema
export interface Package {
  id: string;
  weightInGrams: number;
  loadingLocation: {
    lat: number;
    lng: number;
  };
  loadingTimeInMinutes?: number;
  unloadingLocation?: {
    lat: number;
    lng: number;
  };
  unloadingTimeInMinutes?: number;
}

export interface Vehicle {
  id: string;
  capacityInKG: number;
  startTime?: {
    hour: number;
    minutes: number;
  };
  endTime?: {
    hour: number;
    minutes: number;
  };
  startLocation?: {
    lat: number;
    lng: number;
  };
}

export interface FleetPlannerRequest {
  packages: Package[];
  vehicles: Vehicle[];
  globalStartLocation?: {
    lat: number;
    lng: number;
  };
}

export interface FleetPlannerResponse {
  routes: Array<{
    vehicleId: string;
    waypoints: Array<{
      location: { lat: number; lng: number };
      sequence: number;
      packageId?: string;
      arrivalTime?: string;
      departureTime?: string;
      type?: "pickup" | "dropoff";
    }>;
    summary?: {
      distance: number; // in meters
      duration: number; // in seconds
    };
  }>;
}

// Interface for Route Optimizer response
export interface RouteOptimizerResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        instruction: string;
        name: string;
        type: string;
        way_points: [number, number];
      }>;
    }>;
  }>;
}

export async function getDirections(origin: string, destination: string) {
  const [originLat, originLng] = origin.split(',');
  const [destLat, destLng] = destination.split(',');
  
  const response = await fetch(
    `https://api.olamaps.io/routing/v1/directions?origin=${originLat},${originLng}&destination=${destLat},${destLng}`,
    {
      method: 'POST',
      headers: {
        'X-Request-Id': crypto.randomUUID(),
        'api_key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
    }
  );

  if (!response.ok) throw new Error('Failed to fetch directions');
  return response.json() as Promise<RouteResponse>;
}

export async function textSearch(query: string): Promise<any> {
  const response = await fetch(
    `https://api.olamaps.io/places/v1/textsearch?input=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    { method: "GET" }
  );

  if (!response.ok) throw new Error("Failed to fetch text search results");
  return response.json();
}

export async function autocomplete(query: string): Promise<any> {
  const response = await fetch(
    `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    { method: "GET" }
  );

  if (!response.ok) throw new Error("Failed to fetch autocomplete results");
  return response.json();
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      reject(new Error("Geolocation not supported"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        console.error("Error getting current position:", error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim() === "") {
    console.warn("Empty address provided to geocodeAddress");
    return null;
  }
  
  // Check if the address is already in coordinate format (lat, lng)
  const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
  const coordsMatch = address.trim().match(coordsRegex);
  
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[3]);
    console.log(`Address is already in coordinates format: ${lat}, ${lng}`);
    return { lat, lng };
  }
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("API key is missing for geocoding");
      return null;
    }

    console.log("Geocoding address:", address);
    
    const encodedAddress = encodeURIComponent(address.trim());
    const requestId = crypto.randomUUID();
    
    // This is the proper way to call the OlaMaps Geocoding API
    const response = await fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${encodedAddress}&api_key=${apiKey}`,
      { 
        method: "GET",
        headers: {
          "X-Request-Id": requestId,
          "Accept": "application/json"
        } 
      }
    );

    let responseData: string | any;
    try {
      responseData = await response.text();
      // Try to parse as JSON
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        // If parsing fails, keep as string
      }
    } catch (e) {
      responseData = "Unable to read response";
    }

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status} ${response.statusText}`);
      console.error("Response data:", responseData);
      
      if (response.status === 401) {
        console.error("Authentication failed. API key may be invalid or expired.");
      } else if (response.status === 400) {
        console.error("Bad request. The address format may be incorrect.");
      } else if (response.status === 429) {
        console.error("Too many requests. API rate limit may have been exceeded.");
      }
      
      throw new Error(`Geocoding API error (${response.status}): ${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}`);
    }

    // Ensure responseData is an object now
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseData}`);
      }
    }
    
    if (!responseData || !responseData.results || !Array.isArray(responseData.results) || responseData.results.length === 0) {
      console.warn(`No results found for address: ${address}`);
      return null;
    }
    
    const { lat, lng } = responseData.results[0].geometry.location;
    console.log(`Successfully geocoded address to: ${lat}, ${lng}`);
    return { lat, lng };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

export async function fleetPlanner(data: FleetPlannerRequest): Promise<FleetPlannerResponse> {
  try {
    // Validate and log request data
    console.log("Fleet Planner original request data:", JSON.stringify(data, null, 2));
    
    // Validate essential data
    if (!data.packages || data.packages.length === 0) {
      throw new Error("No packages provided for fleet planning");
    }
    
    if (!data.vehicles || data.vehicles.length === 0) {
      throw new Error("No vehicles provided for fleet planning");
    }
    
    // Format vehicles correctly - capacityInKG should be in kilograms not tons
    const formattedData = {
      ...data,
      vehicles: data.vehicles.map(vehicle => ({
        ...vehicle,
        // Ensure capacity is a reasonable number - store in kg, not tons
        capacityInKG: Math.max(vehicle.capacityInKG || 0, 10) // Minimum 10kg
      }))
    };
    
    console.log("Fleet Planner formatted request data:", JSON.stringify(formattedData, null, 2));
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing");
    }
    
    const requestId = crypto.randomUUID();
    const response = await fetch(
      `https://api.olamaps.io/routing/v1/fleetPlanner?strategy=fair&api_key=${apiKey}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "Accept": "application/json"
        },
        body: JSON.stringify(formattedData),
      }
    );

    // Handle response with better error information
    let responseText = "";
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = "Unable to read response";
    }

    if (!response.ok) {
      console.error("Fleet Planner API error:", response.status, responseText);
      throw new Error(`Fleet Planner API returned ${response.status}: ${responseText}`);
    }

    try {
      const result = JSON.parse(responseText);
      console.log("Fleet Planner API response:", JSON.stringify(result, null, 2));
      return result;
    } catch (e) {
      console.error("Failed to parse Fleet Planner response:", e);
      throw new Error("Invalid JSON response from Fleet Planner API");
    }
  } catch (error) {
    console.error("Fleet Planner error:", error);
    throw error;
  }
}

// Function to call the Route Optimizer API
export async function getOptimizedRoute(locations: { lat: number; lng: number }[]): Promise<RouteOptimizerResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing");
    }

    // Format locations as required by the API: lat,lng|lat,lng|...
    const locationsString = locations.map(loc => `${loc.lat},${loc.lng}`).join('|');
    
    const requestId = crypto.randomUUID();
    const response = await fetch(
      `https://api.olamaps.io/routing/v1/routeOptimizer?locations=${locationsString}&api_key=${apiKey}`,
      { 
        method: "POST",
        headers: {
          "X-Request-Id": requestId,
        } 
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Route Optimizer API error: ${response.status} ${response.statusText}`);
      throw new Error(`Route Optimizer API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Route Optimizer API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Route optimization error:", error);
    throw error;
  }
}
