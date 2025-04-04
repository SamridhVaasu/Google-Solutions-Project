"use client";

import { useEffect, useRef, useState } from "react";
import Head from 'next/head';

export default function MapRenderer({ center = [77.61648476788898, 12.931423492103944], zoom = 12 }: { 
  center?: [number, number]; 
  zoom?: number 
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
        console.log("API Key:", apiKey ? "Valid (starts with " + apiKey.substring(0, 3) + "...)" : "Missing");
        
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
        
        const map = olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-dark-standard/style.json",
          container: mapContainerRef.current.id,  // Using the ID instead of DOM element
          center: center,
          zoom: zoom,
        });
        
        if (!map) {
          throw new Error("Map initialization returned null");
        }
        
        console.log("Map initialized successfully!");
        setStatus('success');
      } catch (err: any) {
        console.error("Error initializing map:", err);
        setStatus('error');
        setErrorMessage(err.message || "Failed to initialize map");
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
    };
  }, [apiKey, center, zoom]);

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
      
      {/* Map container with explicit ID */}
      <div
        id="map-container"
        ref={mapContainerRef}
        className="w-full rounded-lg shadow-md"
        style={{ height: "400px" }}
      ></div>
      
      {/* Debug info */}
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <p>Status: {status} | Center: [{center[0]}, {center[1]}] | Zoom: {zoom}</p>
        <p>API Key: {apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}` : "Missing"}</p>
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