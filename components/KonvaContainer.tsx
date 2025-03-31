"use client";

import { Stage, Layer, Rect, Transformer, Group } from 'react-konva';
import type { Vehicle, Cargo } from '@prisma/client';
import { useCallback, useRef, useState } from 'react';
import { useCargoStore } from '@/lib/store';

interface KonvaContainerProps {
  vehicle: Vehicle;
  cargos: Cargo[];
}

const SCALE_FACTOR = 20; // Increased scale factor for better visualization
const GRID_SIZE = 10;

export default function KonvaContainer({ vehicle, cargos }: KonvaContainerProps) {
  const updateCargoPosition = useCargoStore((state) => state.updateCargoPosition);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<any>(null);

  const checkCollision = (cargo: Cargo, newX: number, newY: number): boolean => {
    const currentBox = {
      x: newX,
      y: newY,
      width: cargo.width * SCALE_FACTOR,
      height: cargo.length * SCALE_FACTOR,
    };

    // Check vehicle boundaries
    if (
      newX < 0 ||
      newY < 0 ||
      newX + currentBox.width > vehicle.width * SCALE_FACTOR ||
      newY + currentBox.height > vehicle.length * SCALE_FACTOR
    ) {
      return true;
    }

    // Check collision with other cargo
    return cargos.some((otherCargo) => {
      if (otherCargo.id === cargo.id) return false;
      
      const otherBox = {
        x: (otherCargo.position as any)?.x || 0,
        y: (otherCargo.position as any)?.y || 0,
        width: otherCargo.width * SCALE_FACTOR,
        height: otherCargo.length * SCALE_FACTOR,
      };

      return !(
        currentBox.x + currentBox.width < otherBox.x ||
        currentBox.x > otherBox.x + otherBox.width ||
        currentBox.y + currentBox.height < otherBox.y ||
        currentBox.y > otherBox.y + otherBox.height
      );
    });
  };

  const handleDragMove = useCallback((cargo: Cargo, e: any) => {
    const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

    if (checkCollision(cargo, newX, newY)) {
      e.target.setAttrs({
        fill: '#ef4444', // Red color for collision
      });
    } else {
      e.target.setAttrs({
        fill: '#3b82f6', // Default blue color
      });
    }
  }, [vehicle, cargos]);

  const handleDragEnd = useCallback((cargo: Cargo, e: any) => {
    const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

    if (!checkCollision(cargo, newX, newY)) {
      const newPosition = {
        x: newX,
        y: newY,
        z: (cargo.position as any)?.z || 0,
      };
      updateCargoPosition(cargo.id, newPosition);
      e.target.setAttrs({
        x: newX,
        y: newY,
        fill: '#3b82f6',
      });
    } else {
      // Reset to original position
      e.target.setAttrs({
        x: (cargo.position as any)?.x || 0,
        y: (cargo.position as any)?.y || 0,
        fill: '#3b82f6',
      });
    }
  }, [updateCargoPosition, vehicle, cargos]);

  // Draw grid lines
  const gridLines = [];
  for (let i = 0; i <= vehicle.width * SCALE_FACTOR; i += GRID_SIZE) {
    gridLines.push(
      <Rect
        key={`vertical-${i}`}
        x={i}
        y={0}
        width={1}
        height={vehicle.length * SCALE_FACTOR}
        fill="#e5e7eb"
      />
    );
  }
  for (let i = 0; i <= vehicle.length * SCALE_FACTOR; i += GRID_SIZE) {
    gridLines.push(
      <Rect
        key={`horizontal-${i}`}
        x={0}
        y={i}
        width={vehicle.width * SCALE_FACTOR}
        height={1}
        fill="#e5e7eb"
      />
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="mb-4 text-sm text-gray-600">
        <p>Vehicle Dimensions: {vehicle.width}m × {vehicle.length}m</p>
        <p>Maximum Weight: {vehicle.maxWeight}kg</p>
        <p>Current Items: {cargos.length}</p>
      </div>
      <Stage 
        width={vehicle.width * SCALE_FACTOR + 40} 
        height={vehicle.length * SCALE_FACTOR + 40}
        className="border border-gray-200 rounded"
      >
        <Layer>
          {/* Background with padding */}
          <Rect
            x={20}
            y={20}
            width={vehicle.width * SCALE_FACTOR}
            height={vehicle.length * SCALE_FACTOR}
            fill="#f8fafc"
            stroke="#d1d5db"
            strokeWidth={2}
          />
          
          {/* Grid */}
          <Group x={20} y={20}>
            {gridLines}
          </Group>

          {/* Cargo items */}
          <Group x={20} y={20}>
            {cargos.map((cargo) => (
              <Rect
                key={cargo.id}
                x={(cargo.position as any)?.x || 0}
                y={(cargo.position as any)?.y || 0}
                width={cargo.width * SCALE_FACTOR}
                height={cargo.length * SCALE_FACTOR}
                fill="#3b82f6"
                stroke="#2563eb"
                strokeWidth={1}
                draggable
                onDragMove={(e) => handleDragMove(cargo, e)}
                onDragEnd={(e) => handleDragEnd(cargo, e)}
                onClick={() => setSelectedId(cargo.id)}
                onTap={() => setSelectedId(cargo.id)}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.2}
                cornerRadius={2}
              />
            ))}
          </Group>

          {/* Selection transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              return oldBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}