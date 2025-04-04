"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import MapRenderer with no SSR
const MapRenderer = dynamic(() => import('@/components/MapRenderer'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function SimpleMapPage() {
  const [center] = useState<[number, number]>([77.61648476788898, 12.931423492103944]);
  const [zoom] = useState(12);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OLA Maps Test Page</h1>
      <p className="mb-4 text-gray-600">
        Testing map rendering with the following project credentials:
      </p>
      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
        <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_OLAMAPS_PROJECT_ID?.substring(0, 8)}...</p>
        <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 5)}...</p>
      </div>
      <div className="h-96 border rounded-lg overflow-hidden">
        <MapRenderer center={center} zoom={zoom} />
      </div>
    </div>
  );
}
