import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const providers = await prisma.aIProvider.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, baseUrl: true, model: true, isDefault: true, createdAt: true },
    // apiKey 不在列表响应中暴露
  });
  return NextResponse.json({ success: true, data: providers });
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

  // 如果设为默认，先清除其他默认
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
}
