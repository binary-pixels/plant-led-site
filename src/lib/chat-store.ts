import { supabase, isSupabaseConfigured } from './supabase';
import { translateToLanguages, getSupportedLocales } from './translate';
import { promises as fs } from 'fs';
import path from 'path';

const MAX_MESSAGES_PER_SESSION = 500;

// ---- File persistence (used when Supabase is not configured) ----
// Data survives server restarts via JSON files in src/data/chat/

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'chat');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const MESSAGES_DIR = path.join(DATA_DIR, 'messages');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(MESSAGES_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

async function loadSessionsFromDisk(): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const arr = JSON.parse(data);
    for (const item of arr) {
      map.set(item.id, item);
    }
  } catch {
    // File doesn't exist yet
  }
  return map;
}

async function saveSessionsToDisk(sessions: Map<string, any>): Promise<void> {
  await ensureDataDir();
  const arr = Array.from(sessions.values());
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
}

async function loadMessagesFromDisk(sessionId: string): Promise<any[]> {
  try {
    const data = await fs.readFile(path.join(MESSAGES_DIR, `${sessionId}.json`), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMessagesToDisk(sessionId: string, messages: any[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(
    path.join(MESSAGES_DIR, `${sessionId}.json`),
    JSON.stringify(messages, null, 2),
    'utf-8'
  );
}

// ---- In-memory fallback (used when Supabase is not configured) ----

const memSessions: Map<string, any> = new Map();
const memMessages: Map<string, any[]> = new Map();
const memCustomers: Map<string, any> = new Map();
// Heartbeat timestamps (works for both memory and Supabase — no schema change needed)
const heartbeatMap: Map<string, number> = new Map();
let memIdCounter = 0;
let memLoaded = false;

async function ensureMemLoaded(): Promise<void> {
  if (memLoaded) return;
  memLoaded = true;
  try {
    const diskSessions = await loadSessionsFromDisk();
    for (const [id, session] of diskSessions) {
      memSessions.set(id, session);
      const msgs = await loadMessagesFromDisk(id);
      memMessages.set(id, msgs);
      if (session.customer_id) {
        memCustomers.set(session.customer_id, {
          id: session.customer_id,
          email: session.customer_email || null,
          name: session.customer_name,
          last_locale: session.customer_last_locale,
        });
      }
    }
  } catch {
    // Failed to load from disk; start fresh
  }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${++memIdCounter}`;
}

// ---- Types (client-safe, no server deps) ----

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'customer' | 'agent' | 'system';
  text: string;
  imageUrl?: string | null;
  locale: string;
  translations: Record<string, string>;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  customerLocale: string;
  customerName: string;
  customerEmail: string;
  assignedAgentId?: string | null;
  status: 'open' | 'closed';
  lastActivity: number;
  lastSeen?: number | null;
  messages: ChatMessage[];
}

// ---- Helpers ----

function toMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.sender_type,
    text: row.text ?? '',
    imageUrl: row.image_url ?? null,
    locale: row.sender_locale,
    translations: {}, // filled separately
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toSession(row: any, messages: ChatMessage[] = []): ChatSession {
  return {
    id: row.id,
    customerLocale: row.customer_last_locale ?? 'en',
    customerName: row.customer_name ?? 'Visitor',
    customerEmail: row.customer_email ?? '',
    assignedAgentId: row.assigned_agent_id,
    status: row.status,
    lastActivity: new Date(row.updated_at ?? row.created_at).getTime(),
    lastSeen: heartbeatMap.get(row.id) ?? null,
    messages,
  };
}

// ---- In-memory fallback implementation ----

async function createSessionMem(
  customerLocale: string,
  customerName: string,
  customerEmail: string
): Promise<ChatSession> {
  await ensureMemLoaded();
  const customerId = genId();
  const sessionId = genId();
  const now = Date.now();

  memCustomers.set(customerId, {
    id: customerId,
    email: customerEmail || null,
    name: customerName,
    last_locale: customerLocale,
  });

  const session = {
    id: sessionId,
    customer_id: customerId,
    customer_last_locale: customerLocale,
    customer_name: customerName,
    customer_email: customerEmail,
    assigned_agent_id: null,
    status: 'open' as const,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
  };

  memSessions.set(sessionId, session);
  memMessages.set(sessionId, []);

  // Persist to disk
  await saveSessionsToDisk(memSessions);
  await saveMessagesToDisk(sessionId, []);

  return toSession(session, []);
}

async function getMemSession(sessionId: string): Promise<ChatSession | null> {
  await ensureMemLoaded();
  const row = memSessions.get(sessionId);
  if (!row) return null;
  const msgs = memMessages.get(sessionId) || [];
  return toSession(row, msgs.map((m: any) => toMessage(m)));
}

async function getAllMemSessions(): Promise<ChatSession[]> {
  await ensureMemLoaded();
  const rows = Array.from(memSessions.values());
  rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return rows.map((row: any) => {
    const msgs = memMessages.get(row.id) || [];
    return toSession(row, msgs.map((m: any) => toMessage(m)));
  });
}

async function addMessageMem(
  sessionId: string,
  role: 'customer' | 'agent',
  text: string,
  locale: string,
  imageUrl?: string | null
): Promise<ChatMessage | null> {
  await ensureMemLoaded();
  const session = memSessions.get(sessionId);
  if (!session) return null;

  const msgs = memMessages.get(sessionId) || [];
  if (msgs.length >= MAX_MESSAGES_PER_SESSION) return null;

  const msg = {
    id: genId(),
    session_id: sessionId,
    sender_type: role,
    sender_id: null,
    text,
    image_url: imageUrl || null,
    sender_locale: locale,
    created_at: new Date().toISOString(),
  };

  msgs.push(msg);
  memMessages.set(sessionId, msgs);

  session.updated_at = new Date().toISOString();

  // Track customer heartbeat for online status
  if (role === 'customer') {
    heartbeatMap.set(sessionId, Date.now());
  }

  // Persist to disk
  await saveSessionsToDisk(memSessions);
  await saveMessagesToDisk(sessionId, msgs);

  return toMessage(msg);
}

async function getMessagesMem(sessionId: string, since?: number): Promise<ChatMessage[]> {
  await ensureMemLoaded();
  const msgs = memMessages.get(sessionId) || [];
  let filtered = msgs;
  if (since) {
    filtered = msgs.filter((m: any) => new Date(m.created_at).getTime() > since);
  }
  // Build translation map (empty for in-memory)
  return filtered.map((m: any) => ({ ...toMessage(m), translations: {} }));
}

async function getSessionsByEmailMem(email: string): Promise<ChatSession[]> {
  await ensureMemLoaded();
  const customerIds = new Set<string>();
  for (const [id, c] of memCustomers) {
    if (c.email === email) customerIds.add(id);
  }
  if (customerIds.size === 0) return [];

  const sessions: ChatSession[] = [];
  for (const [sid, row] of memSessions) {
    if (customerIds.has(row.customer_id)) {
      const msgs = memMessages.get(sid) || [];
      sessions.push(toSession(row, msgs.map((m: any) => toMessage(m))));
    }
  }
  sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  return sessions;
}

async function assignAgentMem(sessionId: string, agentId: string): Promise<boolean> {
  await ensureMemLoaded();
  const session = memSessions.get(sessionId);
  if (!session) return false;
  session.assigned_agent_id = agentId;
  await saveSessionsToDisk(memSessions);
  return true;
}

// ---- Heartbeat (online status) ----

export async function updateSessionHeartbeat(sessionId: string): Promise<void> {
  heartbeatMap.set(sessionId, Date.now());
}

// ---- Session API ----

export async function createSession(
  customerLocale: string,
  customerName: string,
  customerEmail: string
): Promise<ChatSession> {
  if (!isSupabaseConfigured) {
    return await createSessionMem(customerLocale, customerName, customerEmail);
  }

  // Upsert customer
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert(
      { email: customerEmail || null, name: customerName, last_locale: customerLocale },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (custErr || !customer) {
    // Fallback to insert without email
    const { data: c2 } = await supabase
      .from('customers')
      .insert({ name: customerName, last_locale: customerLocale })
      .select()
      .single();
    if (!c2) throw new Error('Failed to create customer');
  }

  const customerRecord = customer || (await supabase
    .from('customers')
    .select()
    .order('created_at', { ascending: false })
    .limit(1)
    .single()).data;

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      customer_id: customerRecord!.id,
      status: 'open',
    })
    .select()
    .single();

  if (error || !session) throw new Error('Failed to create session');
  return toSession(session);
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  if (!isSupabaseConfigured) return await getMemSession(sessionId);

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      customers!inner(*)
    `)
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  const messages = await getMessages(sessionId);
  return toSession(
    {
      ...session,
      customer_name: session.customers?.name,
      customer_email: session.customers?.email,
      customer_last_locale: session.customers?.last_locale,
    },
    messages
  );
}

export async function getAllSessions(): Promise<ChatSession[]> {
  if (!isSupabaseConfigured) return await getAllMemSessions();

  const { data: rows } = await supabase
    .from('sessions')
    .select(`
      *,
      customers!inner(*)
    `)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (!rows) return [];

  const sessions: ChatSession[] = [];
  for (const row of rows) {
    const messages = await getMessages(row.id);
    sessions.push(
      toSession(
        {
          ...row,
          customer_name: row.customers?.name,
          customer_email: row.customers?.email,
          customer_last_locale: row.customers?.last_locale,
        },
        messages
      )
    );
  }
  return sessions;
}

// ---- Message API ----

export async function addMessage(
  sessionId: string,
  role: 'customer' | 'agent',
  text: string,
  locale: string,
  imageUrl?: string | null
): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured) return await addMessageMem(sessionId, role, text, locale, imageUrl);

  // Check message limit
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);
  if (count && count >= MAX_MESSAGES_PER_SESSION) return null;

  // Insert the message
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      sender_type: role,
      text,
      image_url: imageUrl || null,
      sender_locale: locale,
    })
    .select()
    .single();

  if (error || !msg) {
    console.error('Failed to insert message:', error);
    return null;
  }

  // Update session timestamp
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  // Track customer heartbeat for online status
  if (role === 'customer') {
    heartbeatMap.set(sessionId, Date.now());
  }

  // Translate to all supported languages (async, don't block)
  if (process.env.DEEPL_API_KEY) {
    translateAndStore(msg.id, text, locale);
  }

  return toMessage(msg);
}

async function translateAndStore(
  messageId: string,
  text: string,
  sourceLocale: string
) {
  if (!isSupabaseConfigured) return;
  try {
    const targets = getSupportedLocales().filter((l) => l !== sourceLocale);
    const translations = await translateToLanguages(text, targets);

    const rows = Object.entries(translations).map(([locale, translatedText]) => ({
      message_id: messageId,
      locale,
      translated_text: translatedText,
    }));

    if (rows.length > 0) {
      await supabase.from('message_translations').upsert(rows, {
        onConflict: 'message_id, locale',
        ignoreDuplicates: false,
      });
    }
  } catch (err) {
    console.error('Translation failed:', err);
  }
}

export async function getMessages(
  sessionId: string,
  since?: number
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) return await getMessagesMem(sessionId, since);

  let query = supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (since) {
    query = query.gte('created_at', new Date(since).toISOString());
  }

  const { data: rows } = await query;

  if (!rows || rows.length === 0) return [];

  // Fetch translations for all messages
  const msgIds = rows.map((r) => r.id);
  const { data: transRows } = await supabase
    .from('message_translations')
    .select('*')
    .in('message_id', msgIds);

  // Build translation map
  const transMap: Record<string, Record<string, string>> = {};
  if (transRows) {
    for (const t of transRows) {
      if (!transMap[t.message_id]) transMap[t.message_id] = {};
      transMap[t.message_id][t.locale] = t.translated_text;
    }
  }

  return rows.map((r) => ({
    ...toMessage(r),
    translations: transMap[r.id] ?? {},
  }));
}

// ---- Customer history ----

export async function getSessionsByEmail(email: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured) return await getSessionsByEmailMem(email);

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (!customers || customers.length === 0) return [];

  const { data: rows } = await supabase
    .from('sessions')
    .select(`
      *,
      customers!inner(*)
    `)
    .eq('customer_id', customers[0].id)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (!rows) return [];

  const sessions: ChatSession[] = [];
  for (const row of rows) {
    const messages = await getMessages(row.id);
    sessions.push(
      toSession(
        {
          ...row,
          customer_name: row.customers?.name,
          customer_email: row.customers?.email,
          customer_last_locale: row.customers?.last_locale,
        },
        messages
      )
    );
  }
  return sessions;
}

// ---- Agent assignment ----

export async function assignAgent(
  sessionId: string,
  agentId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return await assignAgentMem(sessionId, agentId);

  const { error } = await supabase
    .from('sessions')
    .update({ assigned_agent_id: agentId })
    .eq('id', sessionId);

  return !error;
}

export async function getAgentSessions(agentId: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured) return [];

  const { data: rows } = await supabase
    .from('sessions')
    .select(`
      *,
      customers!inner(*)
    `)
    .eq('assigned_agent_id', agentId)
    .order('updated_at', { ascending: false });

  if (!rows) return [];

  const sessions: ChatSession[] = [];
  for (const row of rows) {
    const messages = await getMessages(row.id);
    sessions.push(
      toSession(
        {
          ...row,
          customer_name: row.customers?.name,
          customer_email: row.customers?.email,
          customer_last_locale: row.customers?.last_locale,
        },
        messages
      )
    );
  }
  return sessions;
}
