// app/api/upload/token/route.ts
import { NextResponse } from 'next/server';
import * as qiniu from 'qiniu';
import { z } from 'zod';

const querySchema = z.object({
  ext: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/)
    .max(10)
    .default('jpg'),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    ext: searchParams.get('ext') ?? 'jpg',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid ext' }, { status: 400 });
  }

  const accessKey = process.env.QINIU_ACCESS_KEY;
  const secretKey = process.env.QINIU_SECRET_KEY;
  const bucket = process.env.QINIU_BUCKET;
  const domain = process.env.QINIU_DOMAIN;
  const uploadUrl =
    process.env.QINIU_UPLOAD_URL ?? 'https://up.qiniup.com';

  if (!accessKey || !secretKey || !bucket || !domain) {
    return NextResponse.json(
      { error: 'Qiniu not configured' },
      { status: 503 },
    );
  }

  const key = `portfolio/${crypto.randomUUID()}.${parsed.data.ext}`;
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  // scope bucket:key restricts this token to exactly this key
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${key}`,
    expires: 3600,
  });
  const token = putPolicy.uploadToken(mac);

  return NextResponse.json({ token, key, domain, uploadUrl });
}
