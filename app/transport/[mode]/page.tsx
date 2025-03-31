"use client";

import { useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useCargoStore } from "@/lib/store";
import VehicleForm from "@/components/VehicleForm";
import CargoList from "@/components/CargoList";
import RouteMap from "@/components/RouteMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

// Dynamically import the Konva components with SSR disabled
const DynamicKonvaContainer = dynamic(
  () => import('@/components/DynamicKonvaContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-center h-[600px]">
        <div className="animate-pulse text-gray-500">Loading cargo visualization...</div>
      </div>
    )
  }
);

export default function TransportMode() {
  const params = useParams();
  const { mode } = params;
  const { selectedVehicle, cargos, currentStep, setCurrentStep } = useCargoStore();

  useEffect(() => {
    return () => {
      useCargoStore.getState().setSelectedVehicle(null);
    };
  }, [mode]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 capitalize"
      >
        {mode} Transport Management
      </motion.h1>

      <Tabs value={currentStep} className="space-y-4">
        <TabsList>
          <TabsTrigger 
            value="vehicle" 
            disabled={currentStep !== 'vehicle'}
          >
            Vehicle Configuration
          </TabsTrigger>
          <TabsTrigger 
            value="cargo" 
            disabled={!selectedVehicle || currentStep !== 'cargo'}
          >
            Cargo Management
          </TabsTrigger>
          <TabsTrigger 
            value="route" 
            disabled={!selectedVehicle || cargos.length === 0 || currentStep !== 'route'}
          >
            Route Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle">
          <VehicleForm mode={mode as string} onSubmit={(data) => console.log(data)} />
        </TabsContent>

        <TabsContent value="cargo">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CargoList />
            {selectedVehicle && (
              <Suspense fallback={
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-center h-[600px]">
                  <div className="animate-pulse text-gray-500">Loading...</div>
                </div>
              }>
                <DynamicKonvaContainer
                  vehicle={selectedVehicle}
                  cargos={cargos}
                />
              </Suspense>
            )}
          </div>
        </TabsContent>

        <TabsContent value="route">
          <RouteMap />
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-between">
        <Button
          onClick={() => {
            if (currentStep === 'route') setCurrentStep('cargo');
            if (currentStep === 'cargo') setCurrentStep('vehicle');
          }}
          disabled={currentStep === 'vehicle'}
        >
          Previous Step
        </Button>
        <Button
          onClick={() => {
            if (currentStep === 'vehicle' && selectedVehicle) setCurrentStep('cargo');
            if (currentStep === 'cargo' && cargos.length > 0) setCurrentStep('route');
          }}
          disabled={(currentStep === 'vehicle' && !selectedVehicle) || 
                   (currentStep === 'cargo' && cargos.length === 0) ||
                   currentStep === 'route'}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}