import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  // Strip the "file:" prefix that SQLite connection strings use
  const dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
  const resolvedUrl = path.resolve(dbPath);
  const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
