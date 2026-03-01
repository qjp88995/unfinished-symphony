import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.apiKey !== undefined) data.apiKey = body.apiKey;
  if (body.model !== undefined) data.model = body.model;
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl;
  if (body.isDefault !== undefined) data.isDefault = body.isDefault;

  try {
    if (body.isDefault === true) {
      await prisma.aIProvider.updateMany({ data: { isDefault: false } });
    }

    const provider = await prisma.aIProvider.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: { id: provider.id, name: provider.name } });
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && err.message.includes("Record to update not found");
    if (isNotFound) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }
    console.error('[PUT /api/providers/[id]]', err);
    return NextResponse.json({ success: false, error: 'Failed to update provider' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.aIProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && err.message.includes("Record to delete does not exist");
    if (isNotFound) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }
    console.error('[DELETE /api/providers/[id]]', err);
    return NextResponse.json({ success: false, error: 'Failed to delete provider' }, { status: 500 });
  }
}
