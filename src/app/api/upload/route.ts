import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Upload to Supabase Storage if configured
    if (supabaseUrl && supabaseAnonKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, supabaseAnonKey);

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `chat-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { data, error } = await sb.storage
        .from('chat-uploads')
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (error) {
        return NextResponse.json(
          { error: 'Upload failed: ' + error.message },
          { status: 500 }
        );
      }

      const { data: urlData } = sb.storage
        .from('chat-uploads')
        .getPublicUrl(fileName);

      return NextResponse.json({ url: urlData.publicUrl });
    }

    // Fallback: base64 data URL (only for small images in development)
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, warning: 'Using base64 fallback' });
  } catch {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
