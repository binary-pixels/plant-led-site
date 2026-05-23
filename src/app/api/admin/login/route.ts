import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { password, name, email } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // When Supabase is not configured, return a mock agent
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        agent: {
          id: `agent-${Date.now()}`,
          name: name || 'Agent',
          email: email || `${name}@admin`,
        },
      });
    }

    // Upsert agent record
    const { data: agent, error } = await supabase
      .from('agents')
      .upsert(
        { email: email || `${name}@admin`, name, is_online: true },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    // Set agent online
    await supabase
      .from('agents')
      .update({ is_online: true })
      .eq('id', agent.id);

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
