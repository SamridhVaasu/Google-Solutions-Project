"use client";

import { useState } from "react";
import { useCargoStore } from "@/lib/store";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function CargoList() {
  const { selectedVehicle, cargos, addCargo, removeCargo, updateCargoPosition, setCurrentStep } = useCargoStore();
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      weight: 100,
      length: 1,
      width: 1,
      height: 1,
      stackable: false,
      rotatable: false,
    },
  });

  const onSubmit = async (data: any) => {
    if (!selectedVehicle) {
      toast({ title: "Error", description: "No vehicle selected", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          vehicleId: selectedVehicle.id,
          position: { x: 0, y: 0, z: 0 },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create cargo");
      }

      const cargo = await response.json();
      addCargo(cargo);
      toast({ title: "Success", description: "Cargo added successfully", variant: "default" });
      reset();
    } catch (error) {
      console.error("Error creating cargo:", error);
      toast({ title: "Error", description: "Failed to create cargo", variant: "destructive" });
    }
  };

  const handleDeleteCargo = async () => {
    if (!selectedCargoId) return;

    try {
      await fetch(`/api/cargos/${selectedCargoId}`, {
        method: "DELETE",
      });

      removeCargo(selectedCargoId);
      setSelectedCargoId(null);
      toast({ title: "Success", description: "Cargo removed successfully", variant: "default" });
    } catch (error) {
      console.error("Error deleting cargo:", error);
      toast({ title: "Error", description: "Failed to delete cargo", variant: "destructive" });
    }
  };

  const handleContinue = () => {
    if (cargos.length === 0) {
      toast({ title: "Error", description: "Add at least one cargo item before continuing", variant: "destructive" });
      return;
    }
    setCurrentStep("route");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-medium mb-4">Cargo Management</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 space-y-4">
        <Input placeholder="Cargo Name" {...register("name")} />
        
        <div className="grid grid-cols-3 gap-3">
          <Input type="number" step="0.1" placeholder="Length (m)" {...register("length")} />
          <Input type="number" step="0.1" placeholder="Width (m)" {...register("width")} />
          <Input type="number" step="0.1" placeholder="Height (m)" {...register("height")} />
        </div>
        
        <Input type="number" step="0.1" placeholder="Weight (kg)" {...register("weight")} />
        
        <div className="flex items-center gap-8">
          <div className="flex items-center space-x-2">
            <Checkbox id="stackable" {...register("stackable")} />
            <label htmlFor="stackable" className="text-sm">Stackable</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="rotatable" {...register("rotatable")} />
            <label htmlFor="rotatable" className="text-sm">Rotatable</label>
          </div>
        </div>
        
        <Button type="submit" className="w-full">Add Cargo</Button>
      </form>

      <div>
        <h3 className="font-medium mb-2">Cargo Items ({cargos.length})</h3>
        <div className="max-h-72 overflow-y-auto">
          {cargos.length === 0 ? (
            <p className="text-gray-500 text-sm">No cargo items added yet</p>
          ) : (
            <ul className="space-y-2">
              {cargos.map((cargo) => (
                <motion.li
                  key={cargo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedCargoId === cargo.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedCargoId(cargo.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{cargo.name}</span>
                    <span>{cargo.weight}kg</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {cargo.length}m × {cargo.width}m × {cargo.height}m
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDeleteCargo}
            disabled={!selectedCargoId}
          >
            Remove Selected
          </Button>
          <Button onClick={handleContinue} disabled={cargos.length === 0}>
            Continue to Route Planning
          </Button>
        </div>
      </div>
    </div>
  );
}