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

export async function geocodeAddress(address: string, language: string = "en"): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&language=${language}&api_key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      {
        method: "GET",
        headers: {
          "X-Request-Id": crypto.randomUUID(),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch geocoding data");
    }

    const data: GeocodeResponse = await response.json();
    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
