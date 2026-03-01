import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

// 简单内存限速：每 IP 每 10 分钟最多 10 次失败尝试
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 分钟
const RATE_LIMIT_MAX = 10;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || record.resetAt < now) return true; // 未超限
  return record.count < RATE_LIMIT_MAX;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || record.resetAt < now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts, please try again later" },
      { status: 429 },
    );
  }

  const { password } = await req.json();

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const isValid = await bcrypt.compare(password, hash);
  if (!isValid) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  clearFailures(ip);

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.isAuthenticated = true;
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  await session.destroy();
  return NextResponse.json({ ok: true });
}
