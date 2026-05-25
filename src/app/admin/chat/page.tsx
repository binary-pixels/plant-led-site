'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatSession } from '@/lib/chat-store';

interface AgentInfo {
  id: string;
  name: string;
  email: string;
}

const POLL_INTERVAL = 2000;
const ONLINE_THRESHOLD_MS = 30000; // 30 seconds

function isAudioUrl(url: string): boolean {
  return /\.(webm|mp3|wav|ogg|m4a)$/i.test(url);
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 660;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
    // Second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not supported
  }
}

function isOnline(session: ChatSession): boolean {
  return !!session.lastSeen && Date.now() - session.lastSeen < ONLINE_THRESHOLD_MS;
}

const localeNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fi: 'Suomi',
};

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState('');
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevSessionsRef = useRef<Map<string, number>>(new Map());

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, scrollToBottom]);

  // Load agent info
  useEffect(() => {
    const stored = sessionStorage.getItem('agent');
    if (stored) {
      try {
        setAgent(JSON.parse(stored));
      } catch {}
    }

    // Cleanup media recorder on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Poll sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const params = new URLSearchParams({ sessionId: 'list', page: String(page), limit: '50' });
        if (searchQuery) params.set('search', searchQuery);
        const res = await fetch(`/api/chat/session?${params}`);
        if (res.ok) {
          const data = await res.json();
          const newSessions: ChatSession[] = data.sessions || [];
          setSessions(newSessions);
          setTotalPages(data.totalPages || 1);

          // Check for new customer messages and play notification sound
          for (const session of newSessions) {
            const customerMsgs = session.messages.filter((m) => m.role === 'customer');
            if (customerMsgs.length === 0) continue;
            const prevCount = prevSessionsRef.current.get(session.id) ?? 0;
            if (prevCount > 0 && customerMsgs.length > prevCount) {
              // Only play if this session is not the currently active one
              if (session.id !== activeSessionId) {
                playNotificationSound();
              }
            }
            prevSessionsRef.current.set(session.id, customerMsgs.length);
          }
        }
      } catch {}
    }
    fetchSessions();
    const interval = setInterval(fetchSessions, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [page, searchQuery, activeSessionId]);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      return `data:${file.type};base64,${base64}`;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---- Voice Recording ----

  async function startRecording() {
    try {
      setRecordingError('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);

        setUploading(true);
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `voice.${ext}`, { type: mimeType });

        try {
          const base64 = await fileToBase64(file);
          const dataUrl = `data:${mimeType};base64,${base64}`;
          await sendAsAgent(dataUrl);
        } catch {
          // fallback
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const next = t + 1;
          if (next >= 60 && mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current!.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setRecordingError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone permissions.'
          : 'Could not start recording. Please try again.'
      );
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function sendAsAgent(imageUrl?: string) {
    if (!input.trim() && !imageUrl) return;
    const text = input.trim();
    setInput('');

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          role: 'agent',
          text: text || ' ',
          locale: 'en',
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send');
      }

      // Refresh
      const params = new URLSearchParams({ sessionId: 'list', page: String(page), limit: '50' });
      if (searchQuery) params.set('search', searchQuery);
      const listRes = await fetch(`/api/chat/session?${params}`);
      if (listRes.ok) {
        const data = await listRes.json();
        setSessions(data.sessions || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setError('Failed to send message');
    }
  }

  async function assignToMe(sessionId: string) {
    if (!agent) return;
    try {
      await fetch('/api/chat/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, agentId: agent.id }),
      });
    } catch {}
  }

  async function exportChat() {
    try {
      const res = await fetch('/api/chat/session?sessionId=list&export=true');
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  function getLastMessagePreview(session: ChatSession): string {
    if (session.messages.length === 0) return 'No messages yet';
    const last = session.messages[session.messages.length - 1];
    const preview = last.text && last.text.trim() ? last.text.slice(0, 50) : last.imageUrl ? (isAudioUrl(last.imageUrl) ? '[Voice]' : '[Image]') : '';
    return `${last.role === 'customer' ? '→' : '←'} ${preview}`;
  }

  function getUnreadCount(session: ChatSession): number {
    if (!session.messages.length) return 0;
    // Count customer messages with no agent reply after
    let count = 0;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'customer') count++;
      else break;
    }
    return count;
  }

  return (
    <div className="flex h-[calc(100vh-53px)]">
      {/* Session List */}
      <div className="w-72 lg:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-900 text-lg">Chat Sessions</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">
                {totalPages > 1 ? `Page ${page}/${totalPages}` : ''}
              </span>
              <button
                onClick={exportChat}
                className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Export all chats as JSON"
              >
                ↓ Export
              </button>
            </div>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              No active sessions
              <br />
              <span className="text-xs">Waiting for customers...</span>
            </div>
          )}

          {sessions.map((session) => {
            const unread = getUnreadCount(session);
            const isAssignedToMe = session.assignedAgentId === agent?.id;
            const isUnassigned = !session.assignedAgentId;
            return (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-purple-50 border-l-4 border-l-purple-600'
                    : isAssignedToMe
                    ? 'border-l-4 border-l-blue-400'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isOnline(session) ? 'bg-green-500' : 'bg-gray-300'
                      }`} title={isOnline(session) ? 'Online' : 'Offline'} />
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {session.customerEmail || session.customerName}
                      </span>
                    </div>
                    {unread > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(session.lastActivity).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {session.customerLocale.toUpperCase()}
                  </span>
                  {isOnline(session) && (
                    <span className="text-[10px] font-medium text-green-600">
                      Online
                    </span>
                  )}
                  {session.customerName && session.customerEmail && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                      {session.customerName}
                    </span>
                  )}
                  {!session.customerEmail && session.customerName && (
                    <span className="text-[10px] text-gray-400 truncate">
                      No email
                    </span>
                  )}
                  {isUnassigned && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                      Unassigned
                    </span>
                  )}
                  {isAssignedToMe && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Mine
                    </span>
                  )}
                  <span className="text-xs text-gray-500 truncate">
                    {getLastMessagePreview(session)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="text-[10px] text-gray-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {activeSession.customerEmail || activeSession.customerName}
                  </span>
                  {activeSession.customerName && activeSession.customerEmail && (
                    <span className="text-xs text-gray-400">
                      ({activeSession.customerName})
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {localeNames[activeSession.customerLocale] ?? activeSession.customerLocale}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-medium ${
                    isOnline(activeSession) ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isOnline(activeSession) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    {isOnline(activeSession) ? 'Online' : 'Offline'}
                  </span>
                </div>
                {activeSession.customerEmail && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium">Email:</span> {activeSession.customerEmail}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!activeSession.assignedAgentId && agent && (
                  <button
                    onClick={() => assignToMe(activeSession.id)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Assign to me
                  </button>
                )}
                {activeSession.assignedAgentId === agent?.id && (
                  <span className="text-[10px] font-medium px-2 py-1 rounded bg-blue-100 text-blue-700">
                    Assigned to you
                  </span>
                )}
                <a
                  href={`/?chat_session=${activeSession.id}`}
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  View as customer →
                </a>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeSession.messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Waiting for the customer to send a message...
                </div>
              )}
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'agent'
                        ? 'bg-purple-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-[10px] font-medium opacity-60 mb-1 flex items-center gap-1">
                      <span>
                        {msg.role === 'agent' ? 'You' : msg.locale.toUpperCase()}
                      </span>
                      <span className="opacity-40">·</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>

                    {/* Image */}
                    {msg.imageUrl && !isAudioUrl(msg.imageUrl) && (
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                      />
                    )}

                    {/* Voice message */}
                    {msg.imageUrl && isAudioUrl(msg.imageUrl) && (
                      <div className="mb-2 flex items-center gap-2">
                        <svg className={`w-4 h-4 shrink-0 ${msg.role === 'agent' ? 'text-purple-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <audio src={msg.imageUrl} controls preload="metadata" className="h-9 max-w-[200px] rounded-lg" />
                      </div>
                    )}

                    {/* Original text */}
                    {msg.text && msg.text.trim() && (
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    )}

                    {/* Translations for customer messages */}
                    {msg.role === 'customer' && (
                      <div className="mt-2 space-y-1">
                        {msg.locale !== 'en' && msg.translations?.en && (
                          <div className="pt-2 border-t border-gray-300">
                            <p className="text-[10px] font-semibold text-gray-500 mb-0.5">
                              ENGLISH
                            </p>
                            <p className="text-xs text-gray-600">
                              {msg.translations.en}
                            </p>
                          </div>
                        )}
                        {msg.locale !== 'zh' && msg.translations?.zh && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 mb-0.5">
                              中文
                            </p>
                            <p className="text-xs text-gray-600">
                              {msg.translations.zh}
                            </p>
                          </div>
                        )}
                        {Object.keys(msg.translations).length > 2 && (
                          <details className="mt-1">
                            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-500">
                              +{Object.keys(msg.translations).length - 2} more languages
                            </summary>
                            <div className="mt-1 space-y-0.5">
                              {Object.entries(msg.translations)
                                .filter(([k]) => k !== 'en' && k !== 'zh')
                                .map(([locale, text]) => (
                                  <p key={locale} className="text-[10px] text-gray-400">
                                    <span className="font-semibold">[{locale.toUpperCase()}] </span>
                                    {text}
                                  </p>
                                ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Show agent message translated to customer's language */}
                    {msg.role === 'agent' && activeSession.customerLocale !== 'en' && msg.translations?.[activeSession.customerLocale] && (
                      <div className="mt-2 pt-2 border-t border-purple-500">
                        <p className="text-[10px] font-semibold text-purple-200 mb-0.5">
                          TRANSLATED TO {activeSession.customerLocale.toUpperCase()}
                        </p>
                        <p className="text-xs text-purple-100">
                          {msg.translations[activeSession.customerLocale]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {(error || recordingError) && (
              <div className="px-6 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100">
                {error || recordingError}
                <button onClick={() => { setError(''); setRecordingError(''); }} className="ml-2 text-red-400 hover:text-red-600">
                  ×
                </button>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAsAgent();
                    }
                  }}
                  placeholder={`Reply in English (will be auto-translated to ${localeNames[activeSession.customerLocale] || 'customer'})...`}
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <div className="flex gap-1.5 self-end">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    title="Send image"
                  >
                    {uploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) await sendAsAgent(url);
                      e.target.value = '';
                    }}
                  />
                  {/* Voice recording button */}
                  <button
                    onClick={toggleRecording}
                    disabled={uploading}
                    className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                      recording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={recording ? 'Stop recording' : 'Record voice message'}
                  >
                    {recording ? (
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        {formatTime(recordingTime)}
                      </span>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => sendAsAgent()}
                    disabled={!input.trim()}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-medium">Select a session to start chatting</p>
              <p className="text-xs mt-1">Customer messages will appear here automatically</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
