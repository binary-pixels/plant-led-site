import { NextResponse } from 'next/server';
import { addMessage } from '@/lib/chat-store';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limit: 30 requests/minute per IP
    const ip = getClientIp(request);
    if (!checkRateLimit(`chat-send:${ip}`, 30)) {
      return NextResponse.json(
        { error: 'Too many requests. Slow down.' },
        { status: 429 }
      );
    }

    const { sessionId, role, text, locale, imageUrl } = await request.json();

    if (!sessionId || !role || (!text && !imageUrl) || !locale) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = await addMessage(sessionId, role, text || '', locale, imageUrl);
    if (!message) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
