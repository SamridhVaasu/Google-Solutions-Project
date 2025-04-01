import React, { useEffect } from "react";
import { OlaMaps } from "olamaps-web-sdk";

const MapRenderer: React.FC = () => {
  useEffect(() => {
    // Initialize OlaMaps with your API key
    const olaMaps = new OlaMaps({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || (() => { throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined"); })(), // Use the environment variable for the API key
    });

    // Initialize the map with your desired configuration
    const myMap = olaMaps.init({
      style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json",
      container: 'map-container',
      center: [77.61648476788898, 12.931423492103944],
      zoom: 15,
      })

    // Cleanup function to destroy the map instance on component unmount
    return () => {
      if (myMap && typeof myMap.destroy === "function") {
        myMap.destroy();
      }
    };
  }, []);

  return <div id="map-container" style={{ width: "100%", height: "100%" }} />;
};

export default MapRenderer;