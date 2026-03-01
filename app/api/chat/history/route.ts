// app/api/chat/history/route.ts
import { prisma } from "@/lib/db";

export async function GET() {
  const records = await prisma.chatRecord.findMany({
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ success: true, data: records });
}

export async function DELETE() {
  await prisma.chatRecord.deleteMany({});
  return Response.json({ success: true });
}
