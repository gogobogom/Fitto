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
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWellnessDNAFull } from './WellnessDNA';
import {
  buildMiraQuestion,
  buildMiraProfilePayload,
  excludedFoodsFromDNA,
  findExcludedHits,
  safeFallbackMessage,
  type Locale,
  type MiraProfilePayload,
} from '@/lib/miraPrompt';

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

function quickActionsFor(lang: Locale): ReadonlyArray<string> {
  return lang === 'tr'
    ? (['Bana bir öğün öner', 'Tatlı istiyorum', 'Motivasyon lazım'] as const)
    : (['Suggest a meal', 'I want something sweet', 'I need motivation'] as const);
}

function welcomeText(lang: Locale): string {
  return lang === 'tr'
    ? "Merhaba, ben Mira ✨ Sıcak ve net bir wellness koçun. Yemek, motivasyon ya da makro sorularını sor — ya da aşağıdaki kısa yollardan birine dokun."
    : "Hi, I'm Mira ✨ Your warm, decisive wellness coach. Ask me about meals, motivation, or macros — or tap a chip below.";
}

function inputPlaceholder(lang: Locale): string {
  return lang === 'tr' ? "Mira'ya bir şey sor…" : 'Ask Mira anything…';
}

function errorTimeoutText(lang: Locale): string {
  return lang === 'tr' ? 'İstek zaman aşımına uğradı. Tekrar dener misin?' : 'The request timed out. Please try again.';
}

function errorNetworkText(lang: Locale): string {
  return lang === 'tr'
    ? 'Sunucuya ulaşamadım. Bağlantını kontrol edip tekrar dener misin?'
    : 'I had trouble reaching the server. Please check your connection and try again.';
}

function emptyAnswerFallback(lang: Locale): string {
  return lang === 'tr'
    ? 'Bu soruyu farklı şekilde sorabilir misin?'
    : "Could you try rephrasing that?";
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Extract the headline of a Mira reply — the first non-empty line,
 * stripped of markdown asterisks and trailing punctuation. Used to
 * build the "don't repeat" hint on the next prompt.
 */
function firstLineOf(text: string): string {
  for (const line of text.split('\n')) {
    const cleaned = line.replace(/^\s*[\d.\-*•]+\s*/, '').replace(/[*_`]/g, '').trim();
    if (cleaned.length > 0) return cleaned.slice(0, 80);
  }
  return '';
}

async function askMira(
  question: string,
  signal: AbortSignal,
  lang: Locale,
  profile: MiraProfilePayload,
): Promise<string> {
  // Backend accepts an optional structured `profile` object alongside
  // `question`. When sent, RAG retrieval engages (used_chunks > 0) and
  // the answer respects DNA fields such as disliked_foods. We always
  // send it (profile has safe empty defaults for users without DNA).
  const requestBody = { question, language: lang, profile };

  // Dev-only debug logging — no secrets, no full prompt dumped.
  // Reports endpoint, body keys, first line + first 300 chars of the
  // question, whether the question starts with the raw user message
  // or with our wrapper, and response key shape on success.
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  if (isDev) {
    const firstLine = question.split('\n', 1)[0] ?? '';
    const looksWrapped = /^\[(FITTO|BAĞLAM|CONTEXT|USER QUESTION|KULLANICI SORUSU)/i.test(firstLine);
     
    console.debug('[MiraChat][req]', {
      endpoint: MIRA_ENDPOINT,
      bodyKeys: Object.keys(requestBody),
      questionFirstLine: firstLine.slice(0, 300),
      questionPreview: question.slice(0, 300),
      questionStartsWithRawUserMessage: !looksWrapped,
      questionLength: question.length,
      locale: lang,
      profileKeys: Object.keys(profile),
      profileSummary: {
        language: profile.language,
        diet: profile.diet,
        goal: profile.goal,
        allergiesCount: profile.allergies.length,
        dislikedCount: profile.disliked_foods.length,
        favoritesCount: profile.favorite_foods.length,
        cookingTime: profile.cooking_time,
        tone: profile.tone,
        healthFlagsCount: profile.health_flags ? Object.keys(profile.health_flags).length : 0,
      },
    });
  }

  const res = await fetch(MIRA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });
  if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
  const data: MiraResponse = await res.json();

  if (isDev) {
     
    console.debug('[MiraChat][res]', {
      ok: true,
      status: res.status,
      responseKeys: Object.keys(data as Record<string, unknown>),
      hasAnswer: typeof data.answer === 'string' && data.answer.trim().length > 0,
      hasUsedChunks: data.used_chunks !== undefined && data.used_chunks !== null,
      usedChunksCount: Array.isArray(data.used_chunks) ? data.used_chunks.length : undefined,
    });
  }

  // Debug-only: surface retrieval chunks so we can verify RAG locally,
  // but never render them to the user.
  if (data.used_chunks !== undefined) {
     
    console.debug('[MiraChat] used_chunks:', data.used_chunks);
  }
  return typeof data.answer === 'string' && data.answer.trim().length > 0
    ? data.answer
    : emptyAnswerFallback(lang);
}

export function MiraChat() {
  const { language } = useLanguage();
  const lang: Locale = language;

  // Resolve the authenticated user so we can pull their Wellness DNA.
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { dna } = useWellnessDNAFull(userId);

  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'mira-welcome', role: 'mira', text: welcomeText(lang) },
  ]);
  // Keep welcome text in sync with locale on language switch
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || prev[0].id !== 'mira-welcome') return prev;
      const next = prev.slice();
      next[0] = { ...next[0], text: welcomeText(lang) };
      return next;
    });
  }, [lang]);

  const [input, setInput] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Last 3 Mira suggestions (first line of each reply) so the next
  // prompt can ask the model not to repeat them.
  const [recentSuggestions, setRecentSuggestions] = useState<string[]>([]);

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
        // Build the compact "User Coaching Context" + Mira behavior
        // rules block that wraps the raw question. The Railway /chat
        // backend forwards the whole payload to its LLM, so this is
        // currently the only way to enforce Mira's tone, intent map
        // and Wellness DNA constraints on every message.
        const excluded = excludedFoodsFromDNA(dna);
        const profile = buildMiraProfilePayload(dna, lang);

        const firstWrapped = buildMiraQuestion({
          userQuestion: question,
          locale: lang,
          dna,
          recentSuggestions,
        });
        let answer = await askMira(firstWrapped, controller.signal, lang, profile);

        // Hard-constraint validation: if the response mentions any
        // allergy / disliked food, ask Mira once for a clean rewrite.
        let hits = findExcludedHits(answer, excluded);
        if (hits.length > 0) {
          console.warn('[MiraChat] DNA violation detected, retrying:', hits);
          const repairWrapped = buildMiraQuestion({
            userQuestion: question,
            locale: lang,
            dna,
            recentSuggestions,
            repairViolations: hits,
          });
          answer = await askMira(repairWrapped, controller.signal, lang, profile);
          hits = findExcludedHits(answer, excluded);
        }

        // If the retry still fails, fall back to a local DNA-safe
        // message instead of rendering an unsafe suggestion.
        if (hits.length > 0) {
          console.warn('[MiraChat] DNA violation persisted after retry:', hits);
          answer = safeFallbackMessage(lang, hits);
        }

        setMessages((prev) => [...prev, { id: newId(), role: 'mira', text: answer }]);

        // Track the headline of this suggestion so we don't repeat it.
        const headline = firstLineOf(answer);
        if (headline) {
          setRecentSuggestions((prev) => [...prev, headline].slice(-3));
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        console.error('[MiraChat] request failed:', err);
        setErrorMsg(aborted ? errorTimeoutText(lang) : errorNetworkText(lang));
      } finally {
        window.clearTimeout(timeoutId);
        setPending(false);
      }
    },
    [pending, lang, dna, recentSuggestions],
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
        aria-label={open ? (lang === 'tr' ? "Mira'yı kapat" : 'Close Mira') : (lang === 'tr' ? "Mira'yı aç" : 'Open Mira')}
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
                <p className="text-xs text-white/80 leading-tight">
                  {lang === 'tr' ? 'sıcak wellness koçun' : 'your warm wellness coach'}
                </p>
              </div>
              <button
                data-testid="mira-chat-close"
                onClick={() => setOpen(false)}
                aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
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
                    <span className="text-xs text-amber-700">
                      {lang === 'tr' ? 'Mira düşünüyor…' : 'Mira is thinking…'}
                    </span>
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
              {quickActionsFor(lang).map((prompt) => (
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
                placeholder={inputPlaceholder(lang)}
                aria-label={lang === 'tr' ? "Mira'ya mesaj" : 'Message Mira'}
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
