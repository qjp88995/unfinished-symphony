// app/api/chat/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const records = await prisma.chatRecord.findMany({
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ success: true, data: records });
}

export async function DELETE() {
  try {
    await prisma.chatRecord.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/chat/history]", err);
    return NextResponse.json(
      { success: false, error: "Failed to clear history" },
      { status: 500 },
    );
  }
}
