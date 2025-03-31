import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.cargo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cargo deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete cargo" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const cargo = await prisma.cargo.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(cargo);
  } catch (error) {
    console.error("Cargo update error:", error);
    return NextResponse.json(
      { error: "Failed to update cargo" },
      { status: 500 }
    );
  }
}
