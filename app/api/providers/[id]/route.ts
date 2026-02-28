import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.isDefault === true) {
    await prisma.aIProvider.updateMany({ data: { isDefault: false } });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.apiKey !== undefined) data.apiKey = body.apiKey;
  if (body.model !== undefined) data.model = body.model;
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl;
  if (body.isDefault !== undefined) data.isDefault = body.isDefault;

  const provider = await prisma.aIProvider.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: { id: provider.id, name: provider.name } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.aIProvider.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
