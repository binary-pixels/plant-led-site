import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/settings.json');

function readSettings(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeSettings(data: Record<string, unknown>): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = readSettings();

    // Merge: only update provided keys, preserve rest
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (existing as any)[key] = { ...((existing as any)[key] || {}), ...value };
      } else {
        (existing as any)[key] = value;
      }
    }

    writeSettings(existing);
    return NextResponse.json(existing);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
