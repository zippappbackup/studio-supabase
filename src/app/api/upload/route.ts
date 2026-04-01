export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getSignedHeaders(method: string, key: string, contentType: string, body: ArrayBuffer | null) {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const region = 'auto';
  const service = 's3';
  const host = `${accountId}.r2.cloudflarestorage.com`;

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');

  const bodyBuffer = body || new ArrayBuffer(0);
  const payloadHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bodyBuffer))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeadersList = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n/${bucket}/${key}\n\n${canonicalHeaders}\n${signedHeadersList}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))))
      .map(b => b.toString(16).padStart(2, '0')).join('');

  const sign = async (key: ArrayBuffer, data: string) =>
    crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), new TextEncoder().encode(data));

  const kDate = await sign(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await sign(kDate, region);
  const kService = await sign(kRegion, service);
  const kSigning = await sign(kService, 'aws4_request');
  const signature = Array.from(new Uint8Array(await sign(kSigning, stringToSign))).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`;

  return {
    'Authorization': authorization,
    'Content-Type': contentType,
    'Host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
}

async function deleteFromR2(oldUrl: string) {
  try {
    const publicUrl = process.env.R2_PUBLIC_URL!;
    const accountId = process.env.R2_ACCOUNT_ID!;
    const bucket = process.env.R2_BUCKET_NAME!;

    // Extract key from public URL
    const key = oldUrl.replace(`${publicUrl}/`, '');
    if (!key || key === oldUrl) return; // URL doesn't match R2

    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    const headers = await getSignedHeaders('DELETE', key, 'application/octet-stream', null);

    await fetch(url, { method: 'DELETE', headers });
  } catch (e) {
    console.error('Failed to delete old file from R2:', e);
    // Non-fatal — don't block the upload
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const storagePath = formData.get('storagePath') as string;
    const oldUrl = formData.get('oldUrl') as string | null;

    if (!file || !storagePath) return NextResponse.json({ error: 'Missing file or storagePath' }, { status: 400 });

    // Build R2 key
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const key = `${user.id}/${storagePath}/${Date.now()}-${sanitizedFileName}`;

    // Convert file to ArrayBuffer
    const buffer = await file.arrayBuffer();
    const contentType = file.type || 'image/jpeg';

    // Upload to R2
    const accountId = process.env.R2_ACCOUNT_ID!;
    const bucket = process.env.R2_BUCKET_NAME!;
    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

    const headers = await getSignedHeaders('PUT', key, contentType, buffer);

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers,
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`R2 upload failed: ${errText}`);
    }

    // Delete old file if provided
    if (oldUrl && oldUrl.includes(process.env.R2_PUBLIC_URL!)) {
      await deleteFromR2(oldUrl);
    }

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
