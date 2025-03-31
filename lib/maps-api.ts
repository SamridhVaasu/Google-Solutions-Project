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
