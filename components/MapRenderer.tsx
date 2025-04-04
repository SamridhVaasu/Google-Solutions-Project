"use client";

import { useEffect, useRef, useState } from "react";
import Head from 'next/head';

export default function MapRenderer({ 
  center = [28.644800, 77.216721], 
  zoom = 12,
  routes = [],
  onLocationFound = null,
}: { 
  center?: [number, number]; 
  zoom?: number;
  routes?: any[];
  onLocationFound?: ((location: { lat: number; lng: number }) => void) | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapInstanceRef = useRef<any>(null);
  const geolocateControlRef = useRef<any>(null);

  useEffect(() => {
    // First, check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Add the OlaMaps SDK script dynamically
    const script = document.createElement('script');
    script.src = "https://unpkg.com/olamaps-web-sdk@latest/dist/olamaps-web-sdk.umd.js";
    script.async = true;
    
    // Set up the initialization function that will run after the script loads
    const initializeMap = () => {
      try {
        console.log("OlaMaps SDK loaded, initializing map...");
        
        if (!window.OlaMaps) {
          throw new Error("OlaMaps global object not found");
        }
        
        if (!mapContainerRef.current) {
          throw new Error("Map container reference not found");
        }
        
        if (!apiKey) {
          throw new Error("API key is missing");
        }
        
        const olaMaps = new window.OlaMaps({
          apiKey: apiKey
        });
        
        console.log("OlaMaps instance created, initializing map view...");
        
        // Create a custom transformer for the style to filter out problematic layers
        const styleTransformer = (style: any) => {
          if (!style || !style.layers) return style;
          
          // Filter out any layers with "3d_model" in their id
          style.layers = style.layers.filter((layer: any) => {
            return !layer.id.includes('3d_model');
          });
          
          return style;
        };
        
        // Initialize map with the styleTransformer
        const map = olaMaps.init({
          container: mapContainerRef.current,
          center: center,
          zoom: zoom,
          antialias: true,
          transformStyle: styleTransformer  // Add this transformer to filter problematic layers
        });
        
        if (!map) {
          throw new Error("Map initialization returned null");
        }
        
        mapInstanceRef.current = map;

        // Add navigation controls
        const navigationControls = olaMaps.addNavigationControls({
          showCompass: true,
          showZoom: true,
          visualizePitch: false,
        });
        map.addControl(navigationControls);

        // Add geolocation control with event listener
        const geolocate = olaMaps.addGeolocateControls({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        });
        
        geolocateControlRef.current = geolocate;
        map.addControl(geolocate);
        
        // Listen for the geolocate event
        if (onLocationFound) {
          map.on('geolocate', (e: any) => {
            const position = e.coords;
            console.log("User location found:", position);
            if (position && onLocationFound) {
              onLocationFound({
                lat: position.latitude,
                lng: position.longitude
              });
            }
          });
        }
        
        // Add error handler for style loading issues - improved to completely suppress specific errors
        map.on('error', (e: any) => {
          // Check if it's the specific 3d_model error and skip logging completely if it is
          if (e?.error?.message?.includes('3d_model')) {
            // Skip logging this specific error entirely
            return;
          }
          
          console.warn("Map error occurred:", e);
          
          // Don't fail the whole map for non-critical errors
          if (e && e.error && e.error.message) {
            if (e.error.message.includes("Source layer") || 
                e.error.message.includes("style") || 
                e.error.message.includes("404") ||
                e.error.message.includes("null")) {
              console.warn("Non-critical map error:", e.error.message);
            } else {
              console.error("Critical map error:", e.error.message);
            }
          }
        });
        
        // Wait for map to load then render routes
        map.on('load', () => {
          console.log("Map loaded successfully");
          if (routes && routes.length > 0) {
            renderRoutes(olaMaps, map, routes);
          }
          setStatus('success');
        });
        
      } catch (err: any) {
        console.error("Error initializing map:", err);
        setStatus('error');
        setErrorMessage(err.message || "Failed to initialize map");
        
        // Try to recover with alternative approach if specific errors occur
        if (err.message?.includes("includes is not a function")) {
          console.log("Attempting recovery with fallback initialization...");
          try {
            // Fallback initialization without any style parameter
            const olaMaps = new window.OlaMaps({
              apiKey: apiKey
            });
            
            const mapConfig = {
              container: mapContainerRef.current,
              center: center,
              zoom: zoom,
              antialias: false,  // Try with antialias disabled
              interactive: true,
              attributionControl: false,
            };
            
            const map = olaMaps.init(mapConfig);
            
            if (map) {
              mapInstanceRef.current = map;
              map.on('load', () => {
                console.log("Map loaded with fallback method");
                setStatus('success');
              });
            }
          } catch (recoveryErr) {
            console.error("Recovery attempt failed:", recoveryErr);
          }
        }
      }
    };
    
    // Set up event handlers for the script
    script.onload = initializeMap;
    script.onerror = () => {
      console.error("Failed to load OlaMaps SDK");
      setStatus('error');
      setErrorMessage("Failed to load OlaMaps SDK");
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Clean up
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // Clean up map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey, center, zoom, onLocationFound]);

  // Handle center/zoom changes
  useEffect(() => {
    if (mapInstanceRef.current && status === 'success') {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, status]);
  
  // Handle route changes - improved with better error handling
  useEffect(() => {
    if (mapInstanceRef.current && window.OlaMaps && status === 'success' && routes && routes.length > 0) {
      try {
        // Only re-render routes if map is already initialized
        const olaMaps = new window.OlaMaps({
          apiKey: apiKey
        });
        renderRoutes(olaMaps, mapInstanceRef.current, routes);
      } catch (error) {
        console.error("Error initializing routes:", error);
        // Don't fail the whole map for route rendering errors
      }
    }
  }, [routes, apiKey, status]);
  
  // Helper function to render routes on the map with improved error handling
  const renderRoutes = (olaMaps: any, map: any, routes: any[]) => {
    try {
      // Remove previous routes
      routes.forEach((_, routeIndex) => {
        const layerId = `route-line-${routeIndex}`;
        const sourceId = `route-source-${routeIndex}`;
        
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (err) {
          console.warn("Error removing previous route:", err);
          // Continue anyway
        }
      });
      
      // Remove existing markers
      const markersToRemove = document.querySelectorAll('.ola-marker');
      markersToRemove.forEach(marker => marker.remove());
      
      // Process route data for display
      routes.forEach((route, routeIndex) => {
        if (!route.waypoints || route.waypoints.length < 2) return;
        
        try {
          // Create a line for the route
          const routeCoordinates = route.waypoints.map((wp: any) => [wp.location.lng, wp.location.lat]);
          
          const sourceId = `route-source-${routeIndex}`;
          const layerId = `route-line-${routeIndex}`;
          
          // Add source for this route
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              }
            }
          });
          
          // Add layer for this route
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
          
          // Add markers for start and end points
          const startWaypoint = route.waypoints[0];
          const endWaypoint = route.waypoints[route.waypoints.length - 1];
          
          // Start marker
          const startEl = document.createElement('div');
          startEl.className = 'ola-marker';
          startEl.style.width = '20px';
          startEl.style.height = '20px';
          startEl.style.borderRadius = '50%';
          startEl.style.backgroundColor = '#10b981'; // Green
          startEl.style.border = '2px solid white';
          startEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          startEl.title = 'Start';
          
          olaMaps.addMarker({
            element: startEl,
            coordinates: [startWaypoint.location.lng, startWaypoint.location.lat],
            anchor: 'bottom'
          }).addTo(map);
          
          // End marker
          const endEl = document.createElement('div');
          endEl.className = 'ola-marker';
          endEl.style.width = '20px';
          endEl.style.height = '20px';
          endEl.style.borderRadius = '50%';
          endEl.style.backgroundColor = '#ef4444'; // Red
          endEl.style.border = '2px solid white';
          endEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          endEl.title = 'End';
          
          olaMaps.addMarker({
            element: endEl,
            coordinates: [endWaypoint.location.lng, endWaypoint.location.lat],
            anchor: 'bottom'
          }).addTo(map);
        } catch (error) {
          console.error(`Error rendering route ${routeIndex}:`, error);
          // Continue with other routes even if one fails
        }
      });
      
    } catch (error) {
      console.error("Error rendering routes:", error);
    }
  };

  // Expose a function to trigger location tracking programmatically
  const triggerGeolocate = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    }
  };

  return (
    <div className="relative">
      {/* Status indicator */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-700">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-70 z-10">
          <div className="text-center p-4 bg-white rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mt-2">Map Error</h3>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            <p className="text-xs text-gray-500 mt-4">Check browser console for more details</p>
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-lg shadow-md"
        style={{ height: "400px" }}
      ></div>
      
      {/* Debug info */}
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <p>Status: {status} | Center: [{center[0].toFixed(5)}, {center[1].toFixed(5)}] | Zoom: {zoom}</p>
        <p>Routes: {routes ? routes.length : 0} | 
           Waypoints: {routes && routes.length > 0 ? routes.reduce((sum, route) => sum + (route.waypoints?.length || 0), 0) : 0}
        </p>
        
        {/* Add a button to manually trigger geolocation */}
        <button 
          onClick={triggerGeolocate}
          className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Get My Location
        </button>
      </div>
    </div>
  );
}

// Add TypeScript interface for the global OlaMaps object
declare global {
  interface Window {
    OlaMaps: any;
  }
}