import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const log = await prisma.activityLog.create({
      data: body
    });
    return NextResponse.json(log);
  } catch (error) {
    console.error('Activity log creation error:', error);
    return NextResponse.json(
      { error: "Failed to create activity log" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Activity log fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" }, 
      { status: 500 }
    );
  }
}
