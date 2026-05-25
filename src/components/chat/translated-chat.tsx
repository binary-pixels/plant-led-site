'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ChatMessage, ChatSession } from '@/lib/chat-store';

const POLL_INTERVAL = 3000; // 3 seconds

function isAudioUrl(url: string): boolean {
  return /\.(webm|mp3|wav|ogg|m4a)$/i.test(url);
}

export default function TranslatedChat({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const t = useTranslations('chat');

  // Restore session from sessionStorage so state survives dialog close/reopen
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('chat_sessionId') : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('chat_name') || '' : ''
  );
  const [email, setEmail] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('chat_email') || '' : ''
  );
  const [emailError, setEmailError] = useState('');
  const [step, setStep] = useState<'form' | 'history' | 'chat'>(() =>
    typeof window !== 'undefined' && sessionStorage.getItem('chat_sessionId') ? 'chat' : 'form'
  );
  const [previousSessions, setPreviousSessions] = useState<ChatSession[]>([]);
  const [viewingHistory, setViewingHistory] = useState<ChatSession | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const composingRef = useRef(false);
  const compositionEndRef = useRef(0);

  // On mount: if restoring a session, fetch messages and start polling
  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId).then((msgs) => {
        if (msgs) setMessages(msgs);
      });
      pollingRef.current = setInterval(async () => {
        const msgs = await fetchMessages(sessionId);
        if (msgs) setMessages(msgs);
      }, POLL_INTERVAL);
    }
    // Cleanup on unmount
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Heartbeat: ping server every 15s while chat is open to show online status
  useEffect(() => {
    if (!sessionId || step !== 'chat') return;
    const heartbeat = async () => {
      try {
        await fetch('/api/chat/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {}
    };
    heartbeat();
    const interval = setInterval(heartbeat, 15000);
    return () => clearInterval(interval);
  }, [sessionId, step]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Start session after form submit
  async function startSession() {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');

    try {
      // Check for previous sessions by email
      const historyRes = await fetch(`/api/chat/customer?email=${encodeURIComponent(email.trim())}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.sessions && historyData.sessions.length > 0) {
          setPreviousSessions(historyData.sessions);
          setStep('history');
          return;
        }
      }

      await createNewSession();
    } catch {
      // fallback
    }
  }

  async function createNewSession() {
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
        }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setStep('chat');

      // Persist session across dialog close/reopen
      sessionStorage.setItem('chat_sessionId', data.sessionId);
      sessionStorage.setItem('chat_name', name.trim() || email.split('@')[0]);
      sessionStorage.setItem('chat_email', email.trim());

      // Poll for new messages
      pollingRef.current = setInterval(async () => {
        const msgs = await fetchMessages(data.sessionId);
        if (msgs) setMessages(msgs);
      }, POLL_INTERVAL);
    } catch {
      // fallback
    }
  }

  async function fetchMessages(sid: string): Promise<ChatMessage[] | null> {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
      const data = await res.json();
      return data.messages;
    } catch {
      return null;
    }
  }

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

  async function sendMessage(imageUrl?: string) {
    if (!input.trim() && !imageUrl) return;
    if (!sessionId) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    // Optimistic: show message immediately
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'customer',
      text: text || ' ',
      imageUrl: imageUrl || null,
      locale,
      translations: {},
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: 'customer',
          text: text || ' ',
          locale,
          imageUrl: imageUrl || undefined,
        }),
      });

      // Immediately fetch updated messages
      const msgs = await fetchMessages(sessionId);
      if (msgs) setMessages(msgs);
    } catch {
      // fallback
    }
    setSending(false);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      await sendMessage(url);
    }
    // Reset input so re-selecting the same file works
    e.target.value = '';
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
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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
          await sendMessage(dataUrl);
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
    } catch {
      setRecordingError('Could not start recording. Please try again.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current && Date.now() - compositionEndRef.current > 100) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Get translation for display based on the viewer's locale
  function getDisplayText(msg: ChatMessage): {
    original: string;
    translated: string | null;
  } {
    const original = msg.text;
    // If message is in the viewer's locale, no translation needed
    // but we can show it in English as a bridge language
    if (msg.locale === locale) {
      return { original, translated: null };
    }

    // Try to find translation in the viewer's locale
    const translated = msg.translations?.[locale] ?? null;
    return { original, translated };
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px]">
      {/* Chat content */}
      {step === 'form' ? (
        /* Name/Email form */
        <div className="flex-1 p-6 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            {t('title')}
          </h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !composingRef.current && Date.now() - compositionEndRef.current > 100) startSession(); }}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => { composingRef.current = false; compositionEndRef.current = Date.now(); }}
            placeholder={t('emailPlaceholder')}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm mb-1 focus:ring-2 focus:ring-purple-500 outline-none ${
              emailError ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {emailError && (
            <p className="text-red-500 text-xs mb-3 ml-1">{emailError}</p>
          )}
          {!emailError && (
            <p className="text-gray-400 text-xs mb-3 ml-1">
              A valid email is required so we can assist you better
            </p>
          )}
          <button
            onClick={startSession}
            disabled={!email.trim()}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('button')}
          </button>
        </div>
      ) : step === 'history' ? (
        /* Previous sessions view */
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-base font-semibold text-gray-900 mb-1 text-center">
            Welcome back, {name}!
          </h3>
          <p className="text-xs text-gray-500 text-center mb-4">
            You have {previousSessions.length} previous conversation{previousSessions.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2 mb-4">
            {previousSessions.map((session) => {
              const lastMsg = session.messages[session.messages.length - 1];
              const msgCount = session.messages.length;
              return (
                <button
                  key={session.id}
                  onClick={() => setViewingHistory(viewingHistory?.id === session.id ? null : session)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    viewingHistory?.id === session.id
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(session.lastActivity).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {msgCount} message{msgCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-gray-500 truncate">
                      {lastMsg.text?.slice(0, 60) || (lastMsg.imageUrl ? '[Image]' : '')}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expanded history messages */}
          {viewingHistory && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Conversation</span>
                <button
                  onClick={() => setViewingHistory(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {viewingHistory.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[90%] rounded-xl px-3 py-1.5 text-xs ${
                      msg.role === 'agent'
                        ? 'bg-white text-gray-700'
                        : 'bg-purple-100 text-gray-800'
                    }`}>
                      {msg.imageUrl && !isAudioUrl(msg.imageUrl) && (
                        <img src={msg.imageUrl} alt="" className="max-w-full rounded-lg mb-1 max-h-32 object-cover" />
                      )}
                      {msg.imageUrl && isAudioUrl(msg.imageUrl) && (
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <audio src={msg.imageUrl} controls preload="metadata" className="h-8 max-w-[140px] rounded" />
                        </div>
                      )}
                      {msg.text?.trim() && <p>{msg.text}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={createNewSession}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
          >
            Start new conversation
          </button>
        </div>
      ) : (
        /* Chat messages */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <p>{t('messagePlaceholder')}</p>
              </div>
            )}

            {messages.map((msg) => {
              const { original, translated } = getDisplayText(msg);
              const isAgent = msg.role === 'agent';
              const needsTranslation = translated && translated !== original;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      isAgent
                        ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        : 'bg-purple-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {isAgent && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Support Agent
                      </p>
                    )}

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
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 shrink-0 ${isAgent ? 'text-gray-400' : 'text-purple-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <audio
                            src={msg.imageUrl}
                            controls
                            preload="metadata"
                            className="h-9 max-w-[180px] rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* Original text */}
                    {original.trim() && (
                      <p className="text-sm leading-relaxed">{original}</p>
                    )}

                    {/* Translated text */}
                    {needsTranslation && (
                      <div
                        className={`mt-1.5 pt-1.5 border-t text-xs ${
                          isAgent
                            ? 'border-gray-300 text-gray-500'
                            : 'border-purple-500 text-purple-100'
                        }`}
                      >
                        <span className="font-medium">[{locale.toUpperCase()}] </span>
                        {translated}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; compositionEndRef.current = Date.now(); }}
                placeholder={t('messagePlaceholder')}
                rows={1}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                style={{ maxHeight: '80px' }}
              />
              <div className="flex gap-1 shrink-0 self-end">
                {/* Image upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
                  onChange={handleImageSelect}
                />
                {/* Voice recording button */}
                <button
                  onClick={toggleRecording}
                  disabled={uploading || sending}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    recording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={recording ? 'Stop recording' : 'Record voice message'}
                >
                  {recording ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-1">
                      <span className="w-2 h-2 bg-white rounded-full" />
                      {formatTime(recordingTime)}
                    </span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
                {/* Send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={sending || (!input.trim() && !uploading)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
              {recordingError && (
                <p className="text-red-500 text-xs mt-2">{recordingError}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
