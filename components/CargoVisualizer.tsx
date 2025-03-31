"use client";

import React, { useState, useRef } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface CargoItem {
  id: string;
  name: string;
  width: number;
  height: number;
  weight: number;
  x: number;
  y: number;
  color: string;
}

interface CargoVisualizerProps {
  vehicle: {
    name: string;
    maxWeight: number;
    dimensions: { width: number; length: number; height: number };
  };
  onNext: (cargoItems: CargoItem[]) => void;
}

const SCALE_FACTOR = 40; // Pixels per meter

export default function CargoVisualizer({ vehicle, onNext }: CargoVisualizerProps) {
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [newCargo, setNewCargo] = useState<CargoItem>({
    id: "",
    name: "",
    width: 1,
    height: 1,
    weight: 100,
    x: 0,
    y: 0,
    color: "#3b82f6",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerWidth = vehicle.dimensions.width * SCALE_FACTOR;
  const containerHeight = vehicle.dimensions.length * SCALE_FACTOR;

  const totalWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);
  const isOverweight = totalWeight > vehicle.maxWeight;

  const handleAddCargo = () => {
    if (!newCargo.name.trim()) {
      toast({ title: "Error", description: "Cargo name is required", variant: "destructive" });
      return;
    }
    if (newCargo.width <= 0 || newCargo.height <= 0 || newCargo.weight <= 0) {
      toast({ title: "Error", description: "Invalid cargo dimensions or weight", variant: "destructive" });
      return;
    }

    const newItem: CargoItem = {
      ...newCargo,
      id: `${Date.now()}`,
    };

    setCargoItems((prev) => [...prev, newItem]);
    toast({ title: "Success", description: "Cargo added successfully", variant: "default" });
    setNewCargo({ ...newCargo, name: "", width: 1, height: 1, weight: 100 });
  };

  const handleRemoveCargo = () => {
    if (selectedId) {
      setCargoItems((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId(null);
      toast({ title: "Success", description: "Cargo removed", variant: "default" });
    }
  };

  const handleDragEnd = (e: any) => {
    const id = e.target.id();
    const updatedItem = {
      ...cargoItems.find((item) => item.id === id),
      x: Math.round(e.target.x() / 10) * 10,
      y: Math.round(e.target.y() / 10) * 10,
    };

    setCargoItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
  };

  const handleContinue = () => {
    if (cargoItems.length === 0) {
      toast({ title: "Error", description: "Add at least one cargo item before continuing", variant: "destructive" });
      return;
    }
    if (isOverweight) {
      toast({ title: "Error", description: "Vehicle is overweight. Remove some cargo before continuing", variant: "destructive" });
      return;
    }
    onNext(cargoItems);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Cargo Visualizer</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cargo Form */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Add New Cargo</h3>
          <Input
            placeholder="Cargo Name"
            value={newCargo.name}
            onChange={(e) => setNewCargo({ ...newCargo, name: e.target.value })}
            className="mb-3"
          />
          <Input
            type="number"
            placeholder="Width (m)"
            value={newCargo.width}
            onChange={(e) => setNewCargo({ ...newCargo, width: parseFloat(e.target.value) || 0 })}
            className="mb-3"
          />
          <Input
            type="number"
            placeholder="Height (m)"
            value={newCargo.height}
            onChange={(e) => setNewCargo({ ...newCargo, height: parseFloat(e.target.value) || 0 })}
            className="mb-3"
          />
          <Input
            type="number"
            placeholder="Weight (kg)"
            value={newCargo.weight}
            onChange={(e) => setNewCargo({ ...newCargo, weight: parseFloat(e.target.value) || 0 })}
            className="mb-3"
          />
          <Button onClick={handleAddCargo} className="w-full">
            Add Cargo
          </Button>
        </div>

        {/* Cargo Visualization */}
        <div className="lg:col-span-2">
          <Stage width={containerWidth} height={containerHeight} className="border">
            <Layer>
              {/* Container Outline */}
              <Rect width={containerWidth} height={containerHeight} stroke="#ccc" strokeWidth={1} />
              {/* Cargo Items */}
              {cargoItems.map((item) => (
                <Rect
                  key={item.id}
                  id={item.id}
                  x={item.x}
                  y={item.y}
                  width={item.width * SCALE_FACTOR}
                  height={item.height * SCALE_FACTOR}
                  fill={item.color}
                  draggable
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between">
        <Button variant="destructive" onClick={handleRemoveCargo} disabled={!selectedId}>
          Remove Selected
        </Button>
        <Button onClick={handleContinue} disabled={isOverweight || cargoItems.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}
