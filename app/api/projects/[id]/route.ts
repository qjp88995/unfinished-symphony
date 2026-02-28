import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.techStack !== undefined) {
    data.techStack = typeof body.techStack === 'string' ? body.techStack : JSON.stringify(body.techStack);
  }
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.liveUrl !== undefined) data.liveUrl = body.liveUrl;
  if (body.repoUrl !== undefined) data.repoUrl = body.repoUrl;
  if (body.featured !== undefined) data.featured = body.featured;
  if (body.order !== undefined) data.order = body.order;

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: project });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
