'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { ChatMessage } from './chat-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Hook to subscribe to real-time message updates via Supabase Realtime.
 * Falls back to polling if Supabase is not configured.
 */
export function useRealtimeMessages(
  sessionId: string | null,
  onMessages: (messages: ChatMessage[]) => void
) {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const since = lastFetchRef.current || undefined;
      const params = new URLSearchParams({ sessionId });
      if (since) params.set('since', String(since));

      const res = await fetch(`/api/chat/messages?${params}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        lastFetchRef.current = Date.now();
        onMessages(data.messages);
      }
    } catch {}
  }, [sessionId, onMessages]);

  useEffect(() => {
    if (!sessionId) return;

    // Try Supabase Realtime first
    if (supabaseUrl && supabaseAnonKey) {
      const sb = createClient(supabaseUrl, supabaseAnonKey);

      // Fetch initial messages
      fetchMessages();

      // Subscribe to new messages
      const channel = sb
        .channel(`session:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        sb.removeChannel(channel);
      };
    }

    // Fallback: polling every 3 seconds
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId, fetchMessages]);
}
