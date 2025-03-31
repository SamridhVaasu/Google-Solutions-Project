"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useCargoStore } from "@/lib/store";

interface VehicleFormProps {
  mode: string;
  onSubmit: (data: any) => void;
}

export default function VehicleForm({ mode, onSubmit }: VehicleFormProps) {
  const { register, handleSubmit, reset } = useForm();
  const setSelectedVehicle = useCargoStore((state) => state.setSelectedVehicle);
  const setCurrentStep = useCargoStore((state) => state.setCurrentStep);

  const handleFormSubmit = async (data: any) => {
    if (!data.name || !data.maxWeight || !data.width || !data.length || !data.height) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      // Parse numeric values
      const vehicleData = {
        ...data,
        mode,
        modelNumber: data.modelNumber || "default-model",
        seats: parseInt(data.seats) || 0,
        length: parseFloat(data.length),
        width: parseFloat(data.width),
        height: parseFloat(data.height),
        maxWeight: parseFloat(data.maxWeight),
        maxVolume: parseFloat(data.length) * parseFloat(data.width) * parseFloat(data.height),
      };

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error("Failed to create vehicle");
      }

      const vehicle = await response.json();
      setSelectedVehicle(vehicle);
      toast({ title: "Success", description: "Vehicle created successfully", variant: "default" });
      reset(); // Reset the form after successful submission
      onSubmit(vehicle);
      setCurrentStep("cargo"); // Advance to the next step
    } catch (error) {
      console.error("Error creating vehicle:", error);
      toast({ title: "Error", description: "Failed to create vehicle", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Vehicle Configuration</h2>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input placeholder="Vehicle Name" {...register("name")} />
        <Input placeholder="Brand" {...register("brand")} />
        <Input placeholder="Model Number" {...register("modelNumber")} />
        <Input type="number" placeholder="Number of Seats" {...register("seats")} />
        <Input 
          type="number"
          step="0.1"
          placeholder="Max Weight (kg)" 
          {...register("maxWeight")} 
        />
        <div className="grid grid-cols-3 gap-4">
          <Input 
            type="number" 
            step="0.1"
            placeholder="Width (m)" 
            {...register("width")} 
          />
          <Input 
            type="number" 
            step="0.1"
            placeholder="Length (m)" 
            {...register("length")} 
          />
          <Input 
            type="number" 
            step="0.1"
            placeholder="Height (m)" 
            {...register("height")} 
          />
        </div>
        <Button type="submit" className="w-full">
          Save Vehicle
        </Button>
      </form>
    </div>
  );
}