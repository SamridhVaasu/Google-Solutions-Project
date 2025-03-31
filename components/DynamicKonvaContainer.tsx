"use client";

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Arrow } from 'react-konva';
import type { Vehicle, Cargo } from '@prisma/client';
import { useCargoStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface KonvaContainerProps {
  vehicle: Vehicle;
  cargos: Cargo[];
}

const SCALE_FACTOR = 20;
const GRID_SIZE = 10;

export default function DynamicKonvaContainer({ vehicle, cargos }: KonvaContainerProps) {
  const updateCargoPosition = useCargoStore((state) => state.updateCargoPosition);
  const updateCargoRotation = useCargoStore((state) => state.updateCargoRotation);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);

  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [spaceUsed, setSpaceUsed] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const weight = cargos.reduce((sum, cargo) => sum + cargo.weight, 0);
    const space = cargos.reduce((sum, cargo) => sum + (cargo.length * cargo.width * cargo.height), 0);
    setTotalWeight(weight);
    setSpaceUsed(space);
  }, [cargos]);

  const checkCollision = useCallback(
    (cargo: Cargo, newX: number, newY: number): boolean => {
      const currentBox = {
        x: newX,
        y: newY,
        width: cargo.width * SCALE_FACTOR,
        height: cargo.length * SCALE_FACTOR,
      };

      if (
        newX < 0 ||
        newY < 0 ||
        newX + currentBox.width > vehicle.width * SCALE_FACTOR ||
        newY + currentBox.height > vehicle.length * SCALE_FACTOR
      ) {
        return true;
      }

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
    },
    [cargos, vehicle.width, vehicle.length]
  );

  const handleDragMove = useCallback(
    (cargo: Cargo, e: any) => {
      const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

      if (checkCollision(cargo, newX, newY)) {
        e.target.setAttrs({
          fill: '#ef4444',
        });
      } else {
        e.target.setAttrs({
          fill: '#3b82f6',
        });
      }
    },
    [checkCollision]
  );

  const handleDragEnd = useCallback(
    (cargo: Cargo, e: any) => {
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
        e.target.setAttrs({
          x: (cargo.position as any)?.x || 0,
          y: (cargo.position as any)?.y || 0,
          fill: '#3b82f6',
        });
      }
    },
    [checkCollision, updateCargoPosition]
  );

  const handleRotate = (cargoId: string, angle: number) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (cargo) {
      const newRotation = (cargo.rotation || 0) + angle;
      updateCargoRotation(cargoId, newRotation % 360);
    }
  };

  const handleStack = (cargoId: string) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (cargo) {
      const newPosition = {
        ...cargo.position,
        z: (cargo.position?.z || 0) + 1, // Increment the z-axis for stacking
      };
      updateCargoPosition(cargoId, newPosition);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();
  };

  const renderGridLines = () => {
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
    return gridLines;
  };

  const renderCargoControls = (cargo: Cargo) => {
    const controls = [];
    if (cargo.rotatable) {
      controls.push(
        <Arrow
          key={`${cargo.id}-rotate`}
          points={[
            cargo.position?.x || 0,
            (cargo.position?.y || 0) - 20,
            cargo.position?.x || 0,
            cargo.position?.y || 0,
          ]}
          pointerLength={10}
          pointerWidth={10}
          fill="#2563eb"
          stroke="#2563eb"
          onClick={() => handleRotate(cargo.id, 90)}
        />
      );
    }
    if (cargo.stackable) {
      controls.push(
        <Arrow
          key={`${cargo.id}-stack`}
          points={[
            (cargo.position?.x || 0) + 20,
            cargo.position?.y || 0,
            cargo.position?.x || 0,
            cargo.position?.y || 0,
          ]}
          pointerLength={10}
          pointerWidth={10}
          fill="#22c55e"
          stroke="#22c55e"
          onClick={() => handleStack(cargo.id)}
        />
      );
    }
    return controls;
  };

  const statsDisplay = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-4 grid grid-cols-2 gap-4 text-sm"
    >
      <div className="bg-blue-50 p-3 rounded">
        <p className="font-semibold">Weight Usage</p>
        <p>{totalWeight}/{vehicle.maxWeight}kg ({((totalWeight/vehicle.maxWeight)*100).toFixed(1)}%)</p>
      </div>
      <div className="bg-green-50 p-3 rounded">
        <p className="font-semibold">Space Usage</p>
        <p>{((spaceUsed/vehicle.maxVolume)*100).toFixed(1)}% Used</p>
      </div>
    </motion.div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="mb-4 text-sm text-gray-600">
        <p>Vehicle Dimensions: {vehicle.width}m × {vehicle.length}m</p>
        <p>Maximum Weight: {vehicle.maxWeight}kg</p>
        <p>Current Items: {cargos.length}</p>
      </div>
      {statsDisplay}
      <div className="border border-gray-200 rounded overflow-hidden">
        <Stage 
          ref={stageRef}
          width={vehicle.width * SCALE_FACTOR + 40} 
          height={vehicle.length * SCALE_FACTOR + 40}
          draggable
          onWheel={handleWheel}
        >
          <Layer>
            <Rect
              x={20}
              y={20}
              width={vehicle.width * SCALE_FACTOR}
              height={vehicle.length * SCALE_FACTOR}
              fill="#f8fafc"
              stroke="#d1d5db"
              strokeWidth={2}
            />
            
            <Group x={20} y={20}>
              {renderGridLines()}
            </Group>

            <Group x={20} y={20}>
              {cargos.map((cargo) => (
                <React.Fragment key={cargo.id}>
                  <Rect
                    id={cargo.id}
                    x={(cargo.position as any)?.x || 0}
                    y={(cargo.position as any)?.y || 0}
                    width={cargo.width * SCALE_FACTOR}
                    height={cargo.length * SCALE_FACTOR}
                    fill="#3b82f6"
                    stroke="#2563eb"
                    strokeWidth={1}
                    draggable
                    rotation={cargo.rotation || 0}
                    onDragMove={(e) => handleDragMove(cargo, e)}
                    onDragEnd={(e) => handleDragEnd(cargo, e)}
                    onClick={() => setSelectedId(cargo.id)}
                    onTap={() => setSelectedId(cargo.id)}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.2}
                    cornerRadius={2}
                  />
                  {renderCargoControls(cargo)}
                </React.Fragment>
              ))}
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
}