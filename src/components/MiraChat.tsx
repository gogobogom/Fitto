'use client';

/**
 * MiraChat
 * ---------------------------------------------------------------
 * Floating "warm wellness coach" chatbot. Sends user questions to
 * the Mira backend (Railway) and renders the conversation as
 * alternating bubbles. Animations via Framer Motion, design via
 * Tailwind. Pure client component so it works inside the static
 * export for iOS / Android (Capacitor).
 *
 * The Next.js root `error.tsx` boundary catches any uncaught throw
 * from here — but we also wrap network calls in try/catch and
 * surface a friendly inline error so a backend hiccup never crashes
 * the surrounding UI.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';

const MIRA_ENDPOINT = 'https://ohara-ai-backend-production.up.railway.app/chat';
const REQUEST_TIMEOUT_MS = 20_000;

interface MiraResponse {
  answer?: string;
  used_chunks?: unknown;
}

type Role = 'user' | 'mira';

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
}

const QUICK_ACTIONS: ReadonlyArray<string> = [
  'Recommend a snack',
  'Low motivation today',
  'Analyze my macros',
] as const;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function askMira(question: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(MIRA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  });
  if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
  const data: MiraResponse = await res.json();
  // Debug-only: surface retrieval chunks so we can verify RAG locally,
  // but never render them to the user.
  if (data.used_chunks !== undefined) {
    // eslint-disable-next-line no-console
    console.debug('[MiraChat] used_chunks:', data.used_chunks);
  }
  return typeof data.answer === 'string' && data.answer.trim().length > 0
    ? data.answer
    : "I'm here whenever you're ready to chat. Could you try rephrasing that?";
}

export function MiraChat() {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'mira-welcome',
      role: 'mira',
      text:
        "Hi, I'm Mira ✨ Your warm wellness coach. Ask me anything about meals, motivation, or your macros — or tap a chip below to get started.",
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to the latest message whenever the conversation grows.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (questionRaw: string): Promise<void> => {
      const question = questionRaw.trim();
      if (!question || pending) return;

      // Cancel any previous outbound request before starting a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      setErrorMsg(null);
      setMessages((prev) => [...prev, { id: newId(), role: 'user', text: question }]);
      setInput('');
      setPending(true);

      try {
        const answer = await askMira(question, controller.signal);
        setMessages((prev) => [...prev, { id: newId(), role: 'mira', text: answer }]);
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        console.error('[MiraChat] request failed:', err);
        setErrorMsg(
          aborted
            ? 'The request timed out. Please try again.'
            : 'I had trouble reaching the server. Please check your connection and try again.',
        );
      } finally {
        window.clearTimeout(timeoutId);
        setPending(false);
      }
    },
    [pending],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void send(input);
    },
    [input, send],
  );

  const onQuickAction = useCallback(
    (prompt: string) => {
      void send(prompt);
    },
    [send],
  );

  const bubbleVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 8, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -4 },
    }),
    [],
  );

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        data-testid="mira-chat-fab"
        aria-label={open ? 'Close Mira' : 'Open Mira'}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="mira-chat-panel"
            role="dialog"
            aria-label="Mira chat"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-44 right-4 z-50 flex flex-col w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-180px))] rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 via-white to-rose-50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 text-white">
              <div className="h-9 w-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">Mira</p>
                <p className="text-xs text-white/80 leading-tight">your warm wellness coach</p>
              </div>
              <button
                data-testid="mira-chat-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-full hover:bg-white/15 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message list */}
            <div
              ref={scrollRef}
              data-testid="mira-chat-messages"
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    variants={bubbleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      data-testid={m.role === 'user' ? 'mira-bubble-user' : 'mira-bubble-mira'}
                      className={
                        m.role === 'user'
                          ? 'max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-orange-500 to-rose-500 text-white px-4 py-2.5 text-sm shadow-md'
                          : 'max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-amber-100 text-amber-950 px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap'
                      }
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {pending && (
                <div className="flex justify-start" data-testid="mira-chat-typing">
                  <div className="rounded-2xl rounded-bl-md bg-white border border-amber-100 px-4 py-2.5 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                    <span className="text-xs text-amber-700">Mira is thinking…</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div
                  data-testid="mira-chat-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-3 pt-1 pb-2 flex flex-wrap gap-2 border-t border-amber-100 bg-white/60">
              {QUICK_ACTIONS.map((prompt) => (
                <button
                  key={prompt}
                  data-testid={`mira-quick-${prompt.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => onQuickAction(prompt)}
                  disabled={pending}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 text-amber-900 border border-amber-200 hover:from-amber-200 hover:to-rose-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={onSubmit}
              className="px-3 pb-3 pt-2 bg-white/80 border-t border-amber-100 flex items-end gap-2"
            >
              <input
                data-testid="mira-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Mira anything…"
                aria-label="Message Mira"
                disabled={pending}
                className="flex-1 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
              />
              <button
                data-testid="mira-chat-send"
                type="submit"
                disabled={pending || !input.trim()}
                aria-label="Send"
                className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 text-white flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
