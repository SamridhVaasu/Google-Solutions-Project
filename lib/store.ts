import { create } from 'zustand';
import { Vehicle, Cargo, Route } from '@prisma/client';

interface CargoState {
  selectedVehicle: Vehicle | null;
  cargos: Cargo[];
  routes: Route[];
  currentStep: 'vehicle' | 'cargo' | 'route';
  setCurrentStep: (step: 'vehicle' | 'cargo' | 'route') => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  addCargo: (cargo: Cargo) => void;
  removeCargo: (cargoId: string) => void;
  updateCargoPosition: (cargoId: string, position: { x: number; y: number; z: number }) => void;
  updateCargoRotation: (cargoId: string, rotation: number) => void;
  setRoutes: (routes: Route[]) => void;
}

export const useCargoStore = create<CargoState>((set) => ({
  selectedVehicle: null,
  cargos: [],
  routes: [],
  currentStep: 'vehicle',
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  addCargo: (cargo) => set((state) => ({ cargos: [...state.cargos, cargo] })),
  removeCargo: (cargoId) =>
    set((state) => ({ cargos: state.cargos.filter((c) => c.id !== cargoId) })),
  updateCargoPosition: (cargoId, position) =>
    set((state) => ({
      cargos: state.cargos.map((c) =>
        c.id === cargoId ? { ...c, position } : c
      ),
    })),
  updateCargoRotation: (cargoId, rotation) =>
    set((state) => ({
      cargos: state.cargos.map((c) =>
        c.id === cargoId ? { ...c, rotation } : c
      ),
    })),
  setRoutes: (routes) => set({ routes }),
}));