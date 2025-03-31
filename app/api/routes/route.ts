import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const route = await prisma.route.create({
      data: body,
    });
    return NextResponse.json(route);
  } catch (error) {
    console.error('Route creation error:', error);
    return NextResponse.json(
      { error: "Failed to create route" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const routes = await prisma.route.findMany();
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Route fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch routes" }, 
      { status: 500 }
    );
  }
}