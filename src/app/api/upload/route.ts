export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function uploadToR2(key: string, body: ArrayBuffer, contentType: string): Promise<boolean> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET_NAME!;

  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const encoder = new TextEncoder();

  const hash = async (data: ArrayBuffer | string): Promise<string> => {
    const buffer = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const hmac = async (keyData: ArrayBuffer, message: string): Promise<ArrayBuffer> => {
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  };

  const payloadHash = await hash(body);

  const headers: Record<string, string> = {
    'content-type': contentType,
    'host': `${accountId}.r2.cloudflarestorage.com`,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHeaders = sortedHeaderKeys.join(';');
  const canonicalRequest = ['PUT', `/${bucket}/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await hash(encoder.encode(canonicalRequest))].join('\n');

  const kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, 'auto');
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign))).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Authorization': authorization },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('R2 upload failed:', response.status, text);
    return false;
  }

  return true;
}

async function deleteFromR2(oldUrl: string): Promise<void> {
  try {
    const publicUrl = process.env.R2_PUBLIC_URL!;
    const key = oldUrl.replace(`${publicUrl}/`, '');
    if (!key || key === oldUrl) return;

    const accountId = process.env.R2_ACCOUNT_ID!;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    const bucket = process.env.R2_BUCKET_NAME!;

    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
    const encoder = new TextEncoder();
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const hmac = async (keyData: ArrayBuffer, message: string): Promise<ArrayBuffer> => {
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    };

    const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const headers: Record<string, string> = {
      'host': `${accountId}.r2.cloudflarestorage.com`,
      'x-amz-content-sha256': emptyHash,
      'x-amz-date': amzDate,
    };

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
    const signedHeaders = sortedHeaderKeys.join(';');
    const canonicalRequest = ['DELETE', `/${bucket}/${key}`, '', canonicalHeaders, signedHeaders, emptyHash].join('\n');

    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
    const canonicalHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, canonicalHash].join('\n');

    const kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
    const kRegion = await hmac(kDate, 'auto');
    const kService = await hmac(kRegion, 's3');
    const kSigning = await hmac(kService, 'aws4_request');
    const signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign))).map(b => b.toString(16).padStart(2, '0')).join('');

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    await fetch(url, {
      method: 'DELETE',
      headers: { ...headers, 'Authorization': authorization },
    });
  } catch (e) {
    console.error('Failed to delete old file from R2:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const storagePath = formData.get('storagePath') as string;
    const oldUrl = formData.get('oldUrl') as string | null;

    if (!file || !storagePath) return NextResponse.json({ error: 'Missing file or storagePath' }, { status: 400 });

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const key = `${user.id}/${storagePath}/${Date.now()}-${sanitizedFileName}`;
    const buffer = await file.arrayBuffer();
    const contentType = file.type || 'image/jpeg';

    const success = await uploadToR2(key, buffer, contentType);
    if (!success) return NextResponse.json({ error: 'Upload to R2 failed' }, { status: 500 });

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
