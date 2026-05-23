import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/chat-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const since = searchParams.get('since');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 }
    );
  }

  const messages = await getMessages(
    sessionId,
    since ? parseInt(since, 10) : undefined
  );

  return NextResponse.json({ messages });
}
