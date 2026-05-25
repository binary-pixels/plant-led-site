import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limit: 10 uploads/minute per IP
    const ip = getClientIp(request);
    if (!checkRateLimit(`upload:${ip}`, 10)) {
      return NextResponse.json(
        { error: 'Too many uploads. Slow down.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    ];
    // Normalize mime type (strip codecs params like ";codecs=opus")
    const baseType = file.type.split(';')[0].trim();
    if (!allowedTypes.includes(baseType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 10MB' },
        { status: 400 }
      );
    }

    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/mp3': 'mp3',
    };
    const ext = file.name.split('.').pop() || extMap[baseType] || (baseType === 'audio/webm' ? 'webm' : 'jpg');
    const isAudio = baseType.startsWith('audio/');
    const uploadDir = isAudio
      ? path.join(process.cwd(), 'public', 'audio')
      : path.join(process.cwd(), 'public', 'images', 'products');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const basePath = isAudio ? '/audio' : '/images/products';
    return NextResponse.json({
      url: `${basePath}/${filename}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
