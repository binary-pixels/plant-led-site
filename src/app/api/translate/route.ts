import { NextResponse } from 'next/server';
import { translateText } from '@/lib/translate';

export async function POST(request: Request) {
  try {
    const { text, targetLocale } = await request.json();

    if (!text || !targetLocale) {
      return NextResponse.json(
        { error: 'Missing required fields: text, targetLocale' },
        { status: 400 }
      );
    }

    const translation = await translateText(text, targetLocale);

    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
