"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import SimpleRouteMap component with no SSR to prevent hydration mismatches
const SimpleRouteMap = dynamic(() => import('@/components/SimpleRouteMap'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center bg-gray-100">Loading route planner...</div>
});

export default function Page() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Route Planning</h1>
      <Suspense fallback={<div className="h-96 flex items-center justify-center bg-gray-100">Loading...</div>}>
        <SimpleRouteMap />
      </Suspense>
    </div>
  );
}