import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/session";
import { emitProjectChange } from "@/lib/project-events";

async function requireAuth() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  return session.isAuthenticated ?? false;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.techStack !== undefined) {
    data.techStack =
      typeof body.techStack === "string"
        ? body.techStack
        : JSON.stringify(body.techStack);
  }
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.liveUrl !== undefined) data.liveUrl = body.liveUrl;
  if (body.repoUrl !== undefined) data.repoUrl = body.repoUrl;
  if (body.featured !== undefined) data.featured = body.featured;
  if (body.order !== undefined) data.order = body.order;

  try {
    const project = await prisma.project.update({ where: { id }, data });
    emitProjectChange().catch((err: unknown) =>
      console.error("[projects/[id]] emitProjectChange failed:", err),
    );
    return NextResponse.json({ success: true, data: project });
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && err.message.includes("Record to update not found");
    if (isNotFound) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }
    console.error("[PUT /api/projects/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id } });
    emitProjectChange().catch((err: unknown) =>
      console.error("[projects/[id]] emitProjectChange failed:", err),
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && err.message.includes("Record to delete does not exist");
    if (isNotFound) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }
    console.error("[DELETE /api/projects/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
