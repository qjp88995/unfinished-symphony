// app/api/chat/history/route.ts
import { prisma } from "@/lib/db";

export async function GET() {
  const records = await prisma.chatRecord.findMany({
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ success: true, data: records });
}
