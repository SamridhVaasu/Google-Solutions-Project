import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add default values for required fields if they're missing
    const vehicleData = {
      name: body.name || "",
      brand: body.brand || "",
      modelNumber: body.modelNumber || "default-model", // Provide a default value
      seats: body.seats || 0, // Provide a default value
      type: body.mode || "road",
      length: parseFloat(body.length) || 0,
      width: parseFloat(body.width) || 0,
      height: parseFloat(body.height) || 0,
      maxWeight: parseFloat(body.maxWeight) || 0,
      maxVolume: body.maxVolume || 0,
    };

    const vehicle = await prisma.vehicle.create({
      data: vehicleData
    });
    
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle creation error:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany();
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Vehicle fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}