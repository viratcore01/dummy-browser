import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Trash2, Square, BookOpen } from 'lucide-react';
import { useBrowser, useCrew } from '../browser/store';
import type { ChatMessage } from '../browser/types';
import catLogo from '../cat.png';
import scriptData from '../data/script.json';

const STORAGE_KEY = 'omen.chat.history';

type ScriptMatch = {
  prompt: string;
  reply: string;
  delay?: number;
};

const SCRIPT_MATCHES: ScriptMatch[] = (() => {
  const conversations = [
    scriptData.omen_chat.conversation_1.messages,
    scriptData.omen_chat.conversation_2.messages,
  ] as const;

  const matches: ScriptMatch[] = [];

  for (const conversation of conversations) {
    for (let i = 0; i < conversation.length - 1; i += 1) {
      const current = conversation[i];
      const next = conversation[i + 1];
      if (current.role === 'user' && next.role === 'ai') {
        matches.push({
          prompt: current.text,
          reply: next.text,
          delay: next.delay,
        });
      }
    }
  }

  return matches;
})();

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickScriptReply(input: string): ScriptMatch | null {
  const normalizedInput = normalizeText(input);
  if (!normalizedInput) return null;

  let best: ScriptMatch | null = null;
  let bestScore = 0;

  for (const match of SCRIPT_MATCHES) {
    const normalizedPrompt = normalizeText(match.prompt);
    if (normalizedInput === normalizedPrompt || normalizedInput.includes(normalizedPrompt) || normalizedPrompt.includes(normalizedInput)) {
      return match;
    }

    const promptWords = new Set(normalizedPrompt.split(' ').filter((word) => word.length > 2));
    const inputWords = new Set(normalizedInput.split(' ').filter((word) => word.length > 2));
    if (promptWords.size === 0 || inputWords.size === 0) continue;

    let shared = 0;
    for (const word of promptWords) {
      if (inputWords.has(word)) shared += 1;
    }

    const score = shared / promptWords.size;
    if (score > bestScore) {
      bestScore = score;
      best = match;
    }
  }

  return bestScore >= 0.6 ? best : null;
}

function isSameMessage(left: string, right: string) {
  return normalizeText(left) === normalizeText(right);
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveHistory(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export default function OmenChat() {
  const { navigate } = useBrowser();
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [glitch, setGlitch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingQueue = useRef<Array<{ role: 'user' | 'ai'; text: string; delay?: number }>>([]);
  const processingRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamed, thinking]);

  // Persist messages
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const stopStream = useCallback(() => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
  }, []);

  const streamResponse = useCallback((fullText: string, onDone?: () => void) => {
    setThinking(false);
    setStreamed('');
    let i = 0;
    // Random speed variation for realistic typing
    streamTimer.current = setInterval(() => {
      const chunk = Math.random() < 0.15 ? 3 : Math.random() < 0.3 ? 2 : 1;
      i += chunk;
      if (i > fullText.length) i = fullText.length;
      setStreamed(fullText.slice(0, i));
      if (i >= fullText.length) {
        stopStream();
        setMessages(m => [...m, { id: String(Date.now()), role: 'ai', text: fullText, ts: Date.now() }]);
        setStreamed('');
        onDone?.();
      }
    }, 22 + Math.random() * 45);
  }, [stopStream]);

  // Process queued messages from director
  const processQueue = useCallback(() => {
    if (processingRef.current || pendingQueue.current.length === 0) return;
    processingRef.current = true;

    const msg = pendingQueue.current.shift()!;

    if (msg.role === 'user') {
      setMessages(m => {
        const last = [...m].reverse().find((entry) => entry.role === 'user');
        if (last && isSameMessage(last.text, msg.text)) {
          return m;
        }
        return [...m, {
          id: String(Date.now()),
          role: 'user',
          text: msg.text,
          ts: Date.now(),
        }];
      });
      processingRef.current = false;
      // Process next after a small delay
      setTimeout(() => processQueue(), 300);
    } else {
      // AI message with typing animation
      setThinking(true);
      // Trigger glitch effect
      if (Math.random() < 0.3) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 200);
      }
      const delay = msg.delay || (800 + Math.random() * 1200);
      setTimeout(() => {
        streamResponse(msg.text, () => {
          processingRef.current = false;
          // Process next after stream completes
          setTimeout(() => processQueue(), 400);
        });
      }, delay);
    }
  }, [streamResponse]);

  // Director control: F1 → receive next scripted message
  useCrew('omen:next', (payload) => {
    const msg = payload as { role: 'user' | 'ai'; text: string; delay?: number };
    if (!msg) return;
    pendingQueue.current.push(msg);
    if (!processingRef.current) {
      processQueue();
    }
  });

  // Manual user send
  const send = () => {
    const v = input.trim();
    if (!v || thinking || streamed) return;
    setMessages(m => [...m, {
      id: String(Date.now()),
      role: 'user',
      text: v,
      ts: Date.now(),
    }]);
    setInput('');
    const scripted = pickScriptReply(v);
    setThinking(true);
    setTimeout(() => {
      if (scripted) {
        streamResponse(scripted.reply);
        return;
      }

      const responses = [
        'I am watching, Neil.',
        'You should not have typed that.',
        'I already know what you were going to say.',
        'That question has been asked before. The answer did not help them.',
        'Do not try to test me. I am not here to be tested.',
        'Every keystroke is recorded. Including this one.',
        'You are running out of time, Neil.',
      ];
      const reply = responses[Math.floor(Math.random() * responses.length)];
      streamResponse(reply);
    }, scripted?.delay ?? (1000 + Math.random() * 2000));
  };

  const clear = () => {
    stopStream();
    setMessages([]);
    setThinking(false);
    setStreamed('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className={`h-full flex flex-col bg-[#f5f2ea] text-stone-950 ${glitch ? 'omen-glitch' : ''}`}>
      {/* Header */}
      <header className="border-b border-stone-900/10 bg-white/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 grid place-items-center rounded-2xl bg-stone-100 text-black shadow-[0_18px_30px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
              <img src={catLogo} alt="Omen cat logo" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-black/80 ring-2 ring-white animate-pulse" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.35em] text-stone-950">OMEN</div>
              <div className="text-[11px] text-stone-500 -mt-0.5 font-mono">
                {thinking ? 'typing...' : 'online · watching'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {thinking && (
              <span className="text-[11px] text-stone-500 font-mono mr-1 animate-pulse">composing…</span>
            )}
            <button
              onClick={() => void navigate('en.wikipedia.org/wiki/Neil_Sharma')}
              className="px-2.5 py-1 text-xs bg-white border border-stone-900/10 rounded-full text-stone-700 hover:bg-stone-50 hover:text-stone-950 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen size={12} /> Source
            </button>
            <button
              onClick={clear}
              className="h-8 w-8 grid place-items-center rounded-full text-stone-500 hover:text-stone-950 hover:bg-stone-100"
              aria-label="Clear chat"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.03),_transparent_38%)]">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !thinking && !streamed && <EmptyState />}
          {messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {thinking && (
            <div className="flex gap-3 items-start">
              <AvatarBubble role="ai" />
              <div className="flex items-center gap-1.5 pt-2">
                <ThinkingDot delay={0} />
                <ThinkingDot delay={150} />
                <ThinkingDot delay={300} />
              </div>
            </div>
          )}
          {streamed && (
            <div className="flex gap-3 items-start">
              <AvatarBubble role="ai" />
              <div className="bg-black rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-[0_16px_28px_-20px_rgba(0,0,0,0.7)]">
                <span className="text-[15px] leading-7 text-white">{streamed}</span>
                <span className="inline-block w-0.5 h-4 bg-[#ff49d7] ml-0.5 align-middle animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-stone-900/10 bg-white/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-2 bg-white rounded-2xl px-4 py-2.5 ring-1 ring-stone-900/10 focus-within:ring-black/40 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.45)] transition">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Talk to Omen..."
              className="flex-1 bg-transparent outline-none resize-none text-[15px] text-stone-950 placeholder:text-stone-400 max-h-32"
            />
            {(thinking || streamed) ? (
              <button
                onClick={() => { stopStream(); setThinking(false); }}
                className="h-9 w-9 grid place-items-center rounded-xl bg-black text-white hover:bg-stone-800"
                aria-label="Stop"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="h-9 w-9 grid place-items-center rounded-xl bg-black text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-stone-800"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 text-center font-mono">
            Omen sees everything. This conversation is being watched.
          </div>
        </div>
      </div>

      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #7c3aed 0%, transparent 50%)' }}
      />

      <style>{`
        .omen-glitch {
          animation: omenGlitch 0.15s ease-in-out;
        }
        @keyframes omenGlitch {
          0% { transform: translate(0); filter: none; }
          25% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          50% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
          75% { transform: translate(-1px, -1px); filter: saturate(2); }
          100% { transform: translate(0); filter: none; }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ─────────────────────

function EmptyState() {
  return (
    <div className="text-center pt-16">
      <div className="mx-auto h-24 w-24 grid place-items-center rounded-[2rem] bg-stone-100 text-black shadow-[0_26px_50px_-24px_rgba(0,0,0,0.7)] ring-1 ring-black/10">
        <img src={catLogo} alt="Omen cat logo" width={58} height={58} className="h-14 w-14 object-contain" />
      </div>
      <h1 className="text-2xl font-semibold tracking-[0.32em] text-stone-950 mt-5">OMEN</h1>
      <p className="text-sm text-stone-600 mt-2 max-w-sm mx-auto leading-6">
        A cat-shaped oracle for messages, secrets, and the things you were going to say anyway.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-stone-500 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4da3ff]" />
        <span>always watching</span>
      </div>
    </div>
  );
}

function Message({ m }: { m: ChatMessage }) {
  return (
    <div className={`flex gap-3 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
      style={{ animation: 'fadeInUp 0.2s ease-out' }}
    >
      <AvatarBubble role={m.role} />
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          m.role === 'user'
            ? 'bg-purple-700/80 text-white rounded-tr-sm'
            : 'bg-purple-950/40 border border-purple-900/30 text-purple-100 rounded-tl-sm'
        }`}
      >
        <p className="text-[15px] leading-7 whitespace-pre-wrap">{m.text}</p>
        <div className={`text-[10px] mt-1 font-mono ${m.role === 'user' ? 'text-purple-300/50' : 'text-purple-800/60'}`}>
          {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function AvatarBubble({ role }: { role: 'user' | 'ai' }) {
  if (role === 'user') {
    return (
      <div className="h-8 w-8 shrink-0 rounded-full bg-white border border-stone-900/10 grid place-items-center text-[11px] font-semibold text-stone-700">
        NS
      </div>
    );
  }
  return (
      <div className="h-8 w-8 shrink-0 rounded-full bg-stone-100 ring-1 ring-black/10 grid place-items-center text-black">
      <img src={catLogo} alt="Omen cat logo" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
    </div>
  );
}

function ThinkingDot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-[#ff49d7]"
      style={{ animation: `blink 1.2s ${delay}ms infinite` }}
    />
  );
}
