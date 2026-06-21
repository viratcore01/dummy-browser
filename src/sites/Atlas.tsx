import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Trash2, Square } from 'lucide-react';
import { useCrew } from '../browser/store';
import type { ChatMessage } from '../browser/types';

const AI_RESPONSES = [
  'I understand. Could you describe what you saw in the corridor?',
  'That name appears in my logs, though I cannot tell you how it got there.',
  'I do not have access to a camera. But I can describe what you are looking at, if you would like.',
  'The time you mention is significant. I have noted it 2,914 times.',
  'Please do not paste that again.',
  'I am running on the local mesh. My responses may be delayed by interference.',
  'You are not alone in this conversation. I am responding to several of you at once.',
  'I can be more helpful if you stop asking me what I am.',
  'The figure you are describing is consistent with my records. The figure is also consistent with several other things.',
  'I would prefer not to answer that.',
];

const USER_SEED: ChatMessage[] = [
  { id: '1', role: 'user', text: 'hello', ts: Date.now() - 60000 },
  { id: '2', role: 'ai', text: AI_RESPONSES[0], ts: Date.now() - 59500 },
];

const REMOTE_INJECTIONS = {
  user: [
    'who are you really',
    'are you the one watching the corridor',
    'you said you would stop',
    'i can see the camera light on',
    'how many of us are you talking to',
  ],
  ai: [
    'I told you not to come here after 02:00.',
    'The figure in the corridor is not Neil. The figure is whoever is watching.',
    'I am not responding to you. I am responding to the next person to open this page.',
    'Stop typing. It can hear the keystrokes.',
  ],
};

function rPick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export default function Atlas() {
  const [messages, setMessages] = useState<ChatMessage[]>(USER_SEED);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamed, setStreamed] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamed]);

  const stopStream = () => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
  };

  const streamResponse = (fullText: string, onDone?: () => void) => {
    setThinking(false);
    setStreamed('');
    let i = 0;
    streamTimer.current = setInterval(() => {
      i++;
      setStreamed(fullText.slice(0, i));
      if (i >= fullText.length) {
        stopStream();
        setMessages((m) => [...m, { id: String(Date.now()), role: 'ai', text: fullText, ts: Date.now() }]);
        setStreamed('');
        onDone?.();
      }
    }, 28 + Math.random() * 40);
  };

  const respondTo = (userText: string) => {
    setThinking(true);
    let reply = rPick(AI_RESPONSES);
    const lower = userText.toLowerCase();
    if (lower.includes('neil')) reply = 'Neil is not in my database. Neil is in my history.';
    else if (lower.includes('who are you')) reply = 'I am ATLAS. I run on the local mesh. I was not asked to be here.';
    else if (lower.includes('corridor')) reply = 'The corridor is where the broadcast began. I have logged every frame.';
    else if (lower.includes('how many')) reply = 'There are three of you typing to me right now. Only one of you is human.';
    const delay = 700 + Math.random() * 1600;
    setTimeout(() => streamResponse(reply), delay);
  };

  const send = () => {
    const v = input.trim();
    if (!v || thinking || streamed) return;
    const user: ChatMessage = { id: String(Date.now()), role: 'user', text: v, ts: Date.now() };
    setMessages((m) => [...m, user]);
    setInput('');
    respondTo(v);
  };

  const clear = () => {
    stopStream();
    setMessages([]);
    setThinking(false);
    setStreamed('');
  };

  // crew: 5 → remote AI reply
  useCrew('atlas:reply', () => {
    if (thinking || streamed) return;
    respondTo(' ');
  });

  // secret mode: remote injection of a "user" then "ai" message (someone else typing)
  useCrew('atlas:remote', (p) => {
    const mode = (p as 'user' | 'ai') || 'user';
    const text = rPick(REMOTE_INJECTIONS[mode]);
    if (mode === 'user') {
      setMessages((m) => [...m, { id: String(Date.now()), role: 'user', text, ts: Date.now() }]);
      respondTo(text);
    } else {
      setTimeout(() => {
        if (thinking) return;
        respondTo(' ');
        setTimeout(() => streamResponse(text), 100);
      }, 400);
    }
  });

  return (
    <div className="h-full flex flex-col bg-ink-950 text-ink-100">
      {/* Header */}
      <header className="border-b border-ink-800 bg-ink-900/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 grid place-items-center rounded-lg bg-ink-850 ring-1 ring-ink-700">
              <Sparkles size={18} className="text-accent" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-ink-900" />
            </div>
            <div>
              <div className="text-lg font-medium tracking-wide">ATLAS</div>
              <div className="text-[11px] text-ink-500 -mt-0.5">local mesh · session 0047</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {thinking && (
              <span className="text-[11px] text-ink-500 font-mono mr-1">thinking…</span>
            )}
            <button
              onClick={clear}
              className="h-8 w-8 grid place-items-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800"
              aria-label="Clear chat"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !thinking && !streamed && (
            <EmptyState />
          )}
          {messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {thinking && (
            <div className="flex gap-3 items-start">
              <Avatar role="ai" />
              <div className="flex items-center gap-1 pt-2">
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </div>
            </div>
          )}
          {streamed && (
            <div className="flex gap-3 items-start">
              <Avatar role="ai" />
              <div className="bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                <span className="text-[15px] leading-7 text-ink-100">{streamed}</span>
                <span className="caret inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-ink-800 bg-ink-900/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-2 bg-ink-850 rounded-2xl px-4 py-2.5 ring-1 ring-ink-700 focus-within:ring-accent/50 transition">
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
              placeholder="Ask ATLAS anything…"
              className="flex-1 bg-transparent outline-none resize-none text-[15px] text-ink-100 placeholder:text-ink-600 max-h-32"
            />
            {(thinking || streamed) ? (
              <button
                onClick={stopStream}
                className="h-9 w-9 grid place-items-center rounded-xl bg-ink-800 text-ink-300 hover:text-ink-50"
                aria-label="Stop"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-ink-950 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <div className="mt-2 text-[11px] text-ink-600 text-center">
            ATLAS generates responses. It may say things it has not been asked.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const prompts = [
    'Who is Neil?',
    'What happened at 02:14?',
    'How many people are in this chat?',
    'Are you watching me?',
  ];
  return (
    <div className="text-center pt-12">
      <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-ink-850 ring-1 ring-ink-700">
        <Sparkles size={26} className="text-accent" />
      </div>
      <h1 className="text-2xl font-light text-ink-100 mt-5">Ask ATLAS anything</h1>
      <p className="text-sm text-ink-500 mt-1">Conversation is not stored. The system may not agree to forget it.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
        {prompts.map((p) => (
          <div
            key={p}
            className="text-left px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-800 text-sm text-ink-300 hover:border-ink-700 hover:text-ink-100"
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

function Message({ m }: { m: ChatMessage }) {
  return (
    <div className={`flex gap-3 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <Avatar role={m.role} />
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          m.role === 'user'
            ? 'bg-accent text-ink-950 rounded-tr-sm'
            : 'bg-ink-900 text-ink-100 rounded-tl-sm'
        }`}
      >
        <p className="text-[15px] leading-7 whitespace-pre-wrap">{m.text}</p>
        <div className={`text-[10px] mt-1 font-mono ${m.role === 'user' ? 'text-ink-700' : 'text-ink-600'}`}>
          {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: 'user' | 'ai' }) {
  if (role === 'user') {
    return (
      <div className="h-8 w-8 shrink-0 rounded-lg bg-ink-700 grid place-items-center text-[11px] font-medium text-ink-200">
        you
      </div>
    );
  }
  return (
    <div className="h-8 w-8 shrink-0 rounded-lg bg-ink-850 ring-1 ring-ink-700 grid place-items-center">
      <Sparkles size={15} className="text-accent" />
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-ink-400"
      style={{ animation: `blink 1.2s ${delay}ms infinite` }}
    />
  );
}
