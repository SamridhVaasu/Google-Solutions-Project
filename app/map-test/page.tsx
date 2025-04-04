"use client";

import { useState } from 'react';
import MapRenderer from '@/components/MapRenderer'; // Direct import, no dynamic loading

export default function MapTestPage() {
  const [apiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
  const [center] = useState<[number, number]>([77.61648476788898, 12.931423492103944]);
  const [zoom] = useState(12);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Map Test</h1>
      
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="font-semibold mb-2">Debugging Information:</h2>
        <p><strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 5)}...` : "Not found"}</p>
        <p><strong>Center:</strong> {center.join(", ")}</p>
        <p><strong>Zoom:</strong> {zoom}</p>
      </div>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <MapRenderer center={center} zoom={zoom} />
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <h2 className="font-medium text-base">Troubleshooting:</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Open browser console (F12) to view detailed error logs</li>
          <li>Ensure API key is correct and has the necessary permissions</li>
          <li>Check network tab for any failed API requests</li>
          <li>Try refreshing the page after script loads</li>
        </ul>
      </div>
    </div>
  );
}
