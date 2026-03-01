import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, techStack, imageUrl, liveUrl, repoUrl, featured, order } = body;

  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: 'title and description are required' },
      { status: 400 }
    );
  }

  // 确保 techStack 始终存储为合法 JSON 数组字符串
  let techStackJson: string;
  if (typeof techStack === 'string') {
    try {
      const parsed = JSON.parse(techStack);
      if (!Array.isArray(parsed)) throw new Error();
      techStackJson = techStack;
    } catch {
      techStackJson = JSON.stringify([]);
    }
  } else {
    techStackJson = JSON.stringify(Array.isArray(techStack) ? techStack : []);
  }

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        techStack: techStackJson,
        imageUrl: imageUrl ?? null,
        liveUrl: liveUrl ?? null,
        repoUrl: repoUrl ?? null,
        featured: featured ?? false,
        order: order ?? 0,
      },
    });
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/projects]', err);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
