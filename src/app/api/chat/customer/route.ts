import { NextResponse } from 'next/server';
import { getSessionsByEmail } from '@/lib/chat-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    const sessions = await getSessionsByEmail(email);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
