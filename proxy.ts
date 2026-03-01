import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 保护 /admin/* 路由（除登录页外）
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAuthenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // 保护需要认证的 API 路由
  if (
    pathname === "/api/chat" ||
    pathname.startsWith("/api/chat/history") ||
    pathname.startsWith("/api/providers") ||
    pathname === "/api/projects/events" ||
    pathname === "/api/upload/token"
  ) {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/chat",
    "/api/chat/history/:path*",
    "/api/providers/:path*",
    "/api/projects/events",
    "/api/upload/token",
  ],
};
