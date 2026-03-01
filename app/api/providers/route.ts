import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const providers = await prisma.aIProvider.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, baseUrl: true, model: true, isDefault: true, createdAt: true },
      // apiKey 不在列表响应中暴露
    });
    return NextResponse.json({ success: true, data: providers });
  } catch (err) {
    console.error('[GET /api/providers]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, apiKey, model, baseUrl, isDefault } = body;

  if (!name || !apiKey || !model) {
    return NextResponse.json(
      { success: false, error: 'name, apiKey, and model are required' },
      { status: 400 }
    );
  }

  try {
    if (isDefault) {
      await prisma.aIProvider.updateMany({ data: { isDefault: false } });
    }

    const provider = await prisma.aIProvider.create({
      data: { name, apiKey, model, baseUrl: baseUrl ?? null, isDefault: isDefault ?? false },
    });

    return NextResponse.json({
      success: true,
      data: { id: provider.id, name: provider.name, model: provider.model, isDefault: provider.isDefault },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/providers]', err);
    return NextResponse.json({ success: false, error: 'Failed to create provider' }, { status: 500 });
  }
}
