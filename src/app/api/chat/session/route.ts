import { NextResponse } from 'next/server';
import { createSession, getSession, getAllSessions, getMessages } from '@/lib/chat-store';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { ChatSession } from '@/lib/chat-store';

export async function POST(request: Request) {
  try {
    // Rate limit: 10 session creations/minute per IP
    const ip = getClientIp(request);
    if (!checkRateLimit(`chat-session:${ip}`, 10)) {
      return NextResponse.json(
        { error: 'Too many requests. Slow down.' },
        { status: 429 }
      );
    }

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

  const isExport = searchParams.get('export') === 'true';

  // List all sessions
  if (sessionId === 'list') {
    let sessions = await getAllSessions();

    // Export mode: return all sessions with full messages, no pagination
    if (isExport) {
      const full: ChatSession[] = [];
      for (const s of sessions) {
        const msgs = await getMessages(s.id);
        full.push({ ...s, messages: msgs });
      }
      return NextResponse.json({ sessions: full, total: full.length });
    }

    // Search filter
    const search = searchParams.get('search')?.toLowerCase();
    if (search) {
      sessions = sessions.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(search) ||
          s.customerEmail?.toLowerCase().includes(search)
      );
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const total = sessions.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = sessions.slice(start, start + limit);

    return NextResponse.json({ sessions: paginated, total, page, limit, totalPages });
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
