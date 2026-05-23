import { NextResponse } from 'next/server';
import { assignAgent } from '@/lib/chat-store';

export async function POST(request: Request) {
  try {
    const { sessionId, agentId } = await request.json();

    if (!sessionId || !agentId) {
      return NextResponse.json(
        { error: 'Missing sessionId or agentId' },
        { status: 400 }
      );
    }

    const success = await assignAgent(sessionId, agentId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to assign agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Assignment failed' },
      { status: 500 }
    );
  }
}
