# Logistics Route Planning System

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Core Workflows](#core-workflows)
5. [API Integration](#api-integration)
6. [Database Schema](#database-schema)
7. [Setup Instructions](#setup-instructions)
8. [Libraries and Dependencies](#libraries-and-dependencies)
9. [Development Guidelines](#development-guidelines)

## System Overview

The Logistics Route Planning System is a comprehensive solution for managing vehicles, cargo, and optimizing delivery routes. The application follows a three-step process:

1. **Vehicle Configuration**: Define vehicle specifications including dimensions and capacity
2. **Cargo Management**: Add and visualize cargo items with their dimensions and placement
3. **Route Planning**: Calculate optimal routes for deliveries with multiple stops

Using OlaMaps integration, the system provides accurate location services, geocoding, and route optimization capabilities. The application serves logistics managers, fleet operators, and transportation companies looking to optimize their delivery operations.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                           │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Next.js Application                         │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│ │   UI Layer     │  │  Business Logic│  │    Data Access Layer   │ │
│ │                │  │                │  │                        │ │
│ │ - Components   │  │ - State Mgmt   │  │ - API Integration      │ │
│ │ - Pages        │  │   (Zustand)    │  │ - Prisma Client        │ │
│ │ - Layouts      │  │ - Logic        │  │                        │ │
│ └────────────────┘  └────────────────┘  └────────────────────────┘ │
└───────────┬────────────────────┬─────────────────────┬─────────────┘
            │                    │                     │
┌───────────▼──────┐  ┌──────────▼─────────┐  ┌───────▼─────────────┐
│  External APIs   │  │ Next.js API Routes  │  │  PostgreSQL Database│
│                  │  │                     │  │                     │
│ - OlaMaps API    │  │ - CRUD Operations   │  │ - Vehicle Data      │
│ - Fleet Planner  │  │ - Authentication    │  │ - Cargo Data        │
│ - Geocoding      │  │                     │  │ - Route Data        │
│                  │  │                     │  │ - Activity Logs     │
└──────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Key Components

### 1. UI Components
- **VehicleForm**: Collects vehicle specifications like dimensions and weight capacity
- **CargoList**: Manages cargo items with their attributes
- **CargoVisualizer**: Visualizes cargo placement using Konva.js
- **RouteMap**: Plans and visualizes delivery routes using OlaMaps SDK
- **MapRenderer**: Renders interactive maps with location markers and route paths

### 2. API & Services
- **maps-api.ts**: Handles geocoding, route optimization and fleet planning
- **geocoding.ts**: Converts addresses to coordinates
- **auth.ts**: Manages authentication with OlaMaps API
- **store.ts**: Global state management with Zustand

### 3. Backend API Routes
- **/api/vehicles**: CRUD operations for vehicles
- **/api/cargos**: CRUD operations for cargo items
- **/api/routes**: Route planning and management 
- **/api/activity-logs**: Logging system activities

## Core Workflows

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│     Vehicle      │     │      Cargo       │     │      Route       │
│  Configuration   ├────►│    Management    ├────►│    Planning      │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  Create Vehicle  │     │  Create Cargo    │     │  Geocode         │
│  Save to Database│     │  Save to Database│     │  Addresses       │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │                        │
                                ▼                        ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │                  │     │                  │
                         │  Visualize       │     │  Calculate       │
                         │  Cargo Placement │     │  Optimal Routes  │
                         │                  │     │                  │
                         └──────────────────┘     └──────────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────────┐
                                                  │                  │
                                                  │  Render Routes   │
                                                  │  on Map          │
                                                  │                  │
                                                  └──────────────────┘
```

## API Integration

### OlaMaps Platform

The system leverages multiple endpoints from the OlaMaps platform:

1. **Geocoding API**
   ```typescript
   // Usage example
   const coordinates = await geocodeAddress("123 Main Street, New York");
   // Returns { lat: 40.7128, lng: -74.0060 }
   ```

2. **Fleet Planner API**
   ```typescript
   // Example request
   const routeResponse = await fleetPlanner({
     packages: [
       {
         id: "package-1",
         weightInGrams: 5000, // 5kg
         loadingLocation: { lat: 12.9716, lng: 77.5946 }, // Origin
         unloadingLocation: { lat: 13.0827, lng: 77.5050 } // Destination
       }
     ],
     vehicles: [
       {
         id: "vehicle-1",
         capacityInKG: 1000,
         startLocation: { lat: 12.9716, lng: 77.5946 }
       }
     ]
   });
   ```

3. **Route Optimizer API**
   ```typescript
   // Find the best route between multiple points
   const optimizedRoute = await getOptimizedRoute([
     { lat: 12.9716, lng: 77.5946 }, // Start point
     { lat: 13.0298, lng: 77.5951 }, // Waypoint 1
     { lat: 13.0827, lng: 77.5050 }  // Destination
   ]);
   ```

4. **Map Rendering**
   ```typescript
   // Initialize map
   const map = new OlaMaps({
     apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   }).init({
     container: mapContainer,
     center: [12.9716, 77.5946],
     zoom: 12
   });
   ```

### Authentication

The system uses OAuth2 client credentials flow for authenticating with the OlaMaps API:

```typescript
// Get access token
const token = await getOlaMapsToken();

// Use token in authenticated requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## Database Schema

The PostgreSQL database includes the following main entities:

### Vehicle
```prisma
model Vehicle {
  id          String   @id @default(uuid())
  name        String
  brand       String
  modelNumber String?
  seats       Int?
  type        String   // road, air, waterway
  length      Float
  width       Float
  height      Float
  maxWeight   Float
  maxVolume   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cargos      Cargo[]
  routes      Route[]
}
```

### Cargo
```prisma
model Cargo {
  id          String   @id @default(uuid())
  name        String
  weight      Float
  length      Float
  width       Float
  height      Float
  stackable   Boolean  @default(false)
  rotatable   Boolean  @default(false)
  position    Json?    // {x: number, y: number, z: number}
  rotation    Float    @default(0)
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Route
```prisma
model Route {
  id          String   @id @default(uuid())
  name        String
  startPoint  Json     // {lat: number, lng: number}
  endPoint    Json     // {lat: number, lng: number}
  waypoints   Json[]   // [{lat: number, lng: number}]
  distance    Float
  duration    Float
  emissions   Float
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ActivityLog
```prisma
model ActivityLog {
  id          String   @id @default(uuid())
  action      String
  details     Json
  createdAt   DateTime @default(now())
}
```

## Setup Instructions

### Prerequisites

- Node.js 16.x or higher
- PostgreSQL database
- OlaMaps API credentials

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/logistics-route-planning.git
   cd logistics-route-planning
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/logistics_db"
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-api-key"
   NEXT_PUBLIC_OLAMAPS_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_OLAMAPS_CLIENT_ID="your-client-id"
   NEXT_PUBLIC_OLAMAPS_CLIENT_SECRET="your-client-secret"
   ```

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:3000

### Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Start the production server
   ```bash
   npm start
   ```

## Libraries and Dependencies

The application uses several key libraries:

- **Next.js**: React framework for server-side rendering
- **Prisma**: ORM for database operations
- **Zustand**: State management 
- **Konva.js**: Canvas-based graphics rendering for cargo visualization
- **OlaMaps SDK**: Mapping, geocoding and route optimization
- **shadcn/ui**: UI component library
- **Framer Motion**: Animation library for UI transitions

## Development Guidelines

### Code Structure

- `/app`: Next.js 13+ app directory containing page routes
- `/components`: Reusable UI components
  - `/ui`: Basic UI components from shadcn
- `/lib`: Utility functions and API integration
- `/prisma`: Database schema and migrations
- `/hooks`: Custom React hooks

### State Management

The application uses Zustand for state management. The main store is defined in `lib/store.ts` and includes:

- Vehicle selection and management
- Cargo item tracking and manipulation
- Navigation state between the different steps of the workflow
- Route planning data

### API Routes

Data operations follow RESTful principles:

- `GET /api/vehicles`: List all vehicles
- `POST /api/vehicles`: Create a new vehicle
- `GET /api/cargos?vehicleId=123`: Get cargo items for a specific vehicle
- `POST /api/cargos`: Add a new cargo item
- `DELETE /api/cargos/123`: Delete a cargo item

### Contributing

1. Create feature branches from `main`
2. Follow the existing code style
3. Add comments for complex logic
4. Write unit tests for important functionality
5. Submit pull requests with detailed descriptions

### Troubleshooting

- **Map Rendering Issues**: Ensure API keys are correctly set and check browser console for errors
- **Database Connection Errors**: Verify database URL and credentials
- **Route Planning Failures**: Check API response for detailed error messages
