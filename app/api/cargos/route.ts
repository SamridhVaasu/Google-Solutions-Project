import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const cargo = await prisma.cargo.create({
      data: {
        name: body.name,
        weight: parseFloat(body.weight),
        length: parseFloat(body.length),
        width: parseFloat(body.width),
        height: parseFloat(body.height),
        stackable: body.stackable || false,
        rotatable: body.rotatable || false,
        position: body.position || { x: 0, y: 0, z: 0 },
        vehicleId: body.vehicleId,
      },
    });
    
    return NextResponse.json(cargo);
  } catch (error) {
    console.error("Cargo creation error:", error);
    return NextResponse.json(
      { error: "Failed to create cargo" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vehicleId = url.searchParams.get("vehicleId");

  try {
    const cargos = vehicleId
      ? await prisma.cargo.findMany({ where: { vehicleId } })
      : await prisma.cargo.findMany();

    return NextResponse.json(cargos);
  } catch (error) {
    console.error("Cargo fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cargos" },
      { status: 500 }
    );
  }
}
