import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, techStack, imageUrl, liveUrl, repoUrl, featured, order } = body;

  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'title and description are required' },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      techStack: typeof techStack === 'string' ? techStack : JSON.stringify(techStack ?? []),
      imageUrl: imageUrl ?? null,
      liveUrl: liveUrl ?? null,
      repoUrl: repoUrl ?? null,
      featured: featured ?? false,
      order: order ?? 0,
    },
  });

  return NextResponse.json({ success: true, data: project }, { status: 201 });
}
