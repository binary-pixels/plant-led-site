import { NextResponse } from 'next/server';
import { createSession, getSession, getAllSessions } from '@/lib/chat-store';

export async function POST(request: Request) {
  try {
    const { locale, name, email } = await request.json();

    if (!locale) {
      return NextResponse.json(
        { error: 'Missing locale' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
    }

    const session = await createSession(
      locale,
      name?.trim() || email.split('@')[0],
      email.trim()
    );

    return NextResponse.json({ sessionId: session.id });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  // List all sessions
  if (sessionId === 'list') {
    const sessions = await getAllSessions();
    return NextResponse.json({ sessions });
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 }
    );
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}
