// app/api/chat/history/clear/route.ts
import { prisma } from "@/lib/db";

export async function POST() {
  await prisma.chatRecord.create({
    data: { type: "clear" },
  });

  return Response.json({ success: true });
}
