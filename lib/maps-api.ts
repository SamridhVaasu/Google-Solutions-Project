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

export interface FleetPlannerResponse {
  routes: Array<{
    vehicleId: string;
    waypoints: Array<{
      location: { lat: number; lng: number };
      sequence: number;
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

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("API key is missing");
      return null;
    }

    console.log("Geocoding address:", address);
    
    const response = await fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&api_key=${apiKey}`,
      { 
        method: "GET",
        headers: {
          "X-Request-Id": crypto.randomUUID(),
        } 
      }
    );

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.error("Authentication failed. Check your API key.");
      }
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    const data: GeocodeResponse = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    console.warn("No results found for address:", address);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function fleetPlanner(data: any): Promise<FleetPlannerResponse> {
  const response = await fetch(
    `https://api.olamaps.io/routing/v1/fleetPlanner?strategy=fair&api_key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error("Failed to fetch fleet planner results");
  return response.json();
}
