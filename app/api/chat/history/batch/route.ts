// app/api/chat/history/batch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string()).min(1).max(20),
});

export async function DELETE(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  try {
    await prisma.chatRecord.deleteMany({
      where: { id: { in: parsed.data.ids } },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/chat/history/batch]", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete records" },
      { status: 500 },
    );
  }
}
