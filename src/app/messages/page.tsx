'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';
import type { Message } from '@/types';

interface Thread {
  userId: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  jobId: string | null;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const withUser = searchParams.get('with');
  const jobId    = searchParams.get('job');

  const [currentUserId, setCurrentUserId] = useState('');
  const [threads,  setThreads]  = useState<Thread[]>([]);
  const [active,   setActive]   = useState<string | null>(withUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [nameMap,  setNameMap]  = useState<Record<string, string>>({});
  const bottomRef    = useRef<HTMLDivElement>(null);
  const activeRef    = useRef<string | null>(withUser);  // avoid stale closure in realtime callback
  const uidRef       = useRef<string>('');
  const loadThreadsRef = useRef<(uid: string) => Promise<void>>();

  // Keep refs in sync
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const supabase = createClient();

    async function loadThreads(uid: string) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false });
      if (!data) return;

      const threadMap: Record<string, Thread> = {};
      const otherIds = new Set<string>();
      data.forEach(msg => {
        const other = msg.sender_id === uid ? msg.recipient_id : msg.sender_id;
        otherIds.add(other);
        if (!threadMap[other]) {
          threadMap[other] = { userId: other, name: other, lastMessage: msg.content, lastAt: msg.created_at, unread: 0, jobId: msg.job_id };
        }
        if (msg.recipient_id === uid && !msg.read) threadMap[other].unread++;
      });

      const ids = Array.from(otherIds);
      if (ids.length > 0) {
        const [{ data: coaches }, { data: schools }] = await Promise.all([
          supabase.from('coach_profiles').select('user_id, full_name').in('user_id', ids),
          supabase.from('schools').select('user_id, name, contact_name').in('user_id', ids),
        ]);
        const nm: Record<string, string> = {};
        coaches?.forEach(c => { nm[c.user_id] = c.full_name; });
        schools?.forEach(s => { nm[s.user_id] = s.contact_name ?? s.name; });
        setNameMap(prev => ({ ...prev, ...nm }));
        Object.values(threadMap).forEach(t => { t.name = nm[t.userId] ?? 'Unknown'; });
      }

      // If opening a new thread via ?with= that has no messages yet, pre-populate name
      if (withUser && !threadMap[withUser]) {
        const [{ data: coaches }, { data: schools }] = await Promise.all([
          supabase.from('coach_profiles').select('user_id, full_name').eq('user_id', withUser),
          supabase.from('schools').select('user_id, name, contact_name').eq('user_id', withUser),
        ]);
        const nm: Record<string, string> = {};
        coaches?.forEach(c => { nm[c.user_id] = c.full_name; });
        schools?.forEach(s => { nm[s.user_id] = s.contact_name ?? s.name; });
        setNameMap(prev => ({ ...prev, ...nm }));
      }

      setThreads(Object.values(threadMap).sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
    }

    loadThreadsRef.current = loadThreads;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      uidRef.current = user.id;
      await loadThreads(user.id);

      // Realtime subscription for new incoming messages
      const channel = supabase
        .channel(`inbox:${user.id}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `recipient_id=eq.${user.id}`,
        }, async (payload) => {
          const msg = payload.new as Message;

          // If the message is from the active thread, append it and mark read
          if (activeRef.current === msg.sender_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            await supabase.from('messages').update({ read: true }).eq('id', msg.id);
          } else {
            // Otherwise bump unread count on that thread
            setThreads(prev => {
              const existing = prev.find(t => t.userId === msg.sender_id);
              if (existing) {
                return prev.map(t => t.userId === msg.sender_id
                  ? { ...t, unread: t.unread + 1, lastMessage: msg.content, lastAt: msg.created_at }
                  : t
                ).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
              }
              // New thread — reload to get the sender's name
              if (loadThreadsRef.current) loadThreadsRef.current(uidRef.current);
              return prev;
            });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) loadMessages(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages(otherId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    setMessages((data ?? []) as Message[]);

    // Mark as read
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', otherId)
      .eq('recipient_id', user.id)
      .eq('read', false);

    setThreads(prev => prev.map(t => t.userId === otherId ? { ...t, unread: 0 } : t));
  }

  async function send() {
    if (!text.trim() || !active || !currentUserId || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data } = await supabase.from('messages').insert({
      sender_id:    currentUserId,
      recipient_id: active,
      job_id:       jobId ?? null,
      content:      text.trim(),
    }).select().single();
    if (data) {
      setMessages(prev => [...prev, data as Message]);
      setText('');
      // Update thread list to reflect latest message
      setThreads(prev => {
        const msg = data as Message;
        const existing = prev.find(t => t.userId === active);
        if (existing) {
          return prev.map(t => t.userId === active
            ? { ...t, lastMessage: msg.content, lastAt: msg.created_at }
            : t
          ).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
        }
        return prev;
      });
    }
    setSending(false);
  }

  const activeName = nameMap[active ?? ''] ?? 'Chat';
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm font-bold">← Back</Link>
        {active ? (
          <>
            <button onClick={() => setActive(null)} className="text-xs text-gray-500 hover:text-gray-700 sm:hidden">⬅</button>
            <span className="font-extrabold text-base text-gray-900">{activeName}</span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-gray-900">Messages</span>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {totalUnread}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        {/* Thread list */}
        <div className={`${active ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 flex-col border-r border-gray-100 bg-white overflow-y-auto`}>
          {threads.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-extrabold text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation from a job or coach profile.</p>
            </div>
          ) : (
            threads.map(t => (
              <button key={t.userId}
                onClick={() => { setActive(t.userId); activeRef.current = t.userId; loadMessages(t.userId); }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${active === t.userId ? 'bg-green-50' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      t.unread > 0 ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                    }`}>
                      {t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${t.unread > 0 ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>{t.name}</p>
                      <p className={`text-xs truncate ${t.unread > 0 ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>{t.lastMessage}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-400">{timeAgo(t.lastAt)}</p>
                    {t.unread > 0 && (
                      <span className="bg-green-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ml-auto mt-1">
                        {t.unread > 9 ? '9+' : t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat window */}
        <div className={`${!active ? 'hidden sm:flex' : 'flex'} flex-1 flex-col bg-white`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-5xl mb-4">💬</div>
                <p className="text-sm font-extrabold text-gray-500">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(msg => {
                  const mine = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-green-200' : 'text-gray-400'}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message…"
                  className="flex-1 text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
                />
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors"
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}
