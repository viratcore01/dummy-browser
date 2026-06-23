import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Trash2, Square, MoreVertical, Play, Pause, SkipForward, Edit2, Download, Clock } from 'lucide-react';
import { useBrowser, useCrew } from '../browser/store';
import type { ChatMessage } from '../browser/types';

const SCRIPTED_CONVERSATION: { role: 'user' | 'ai'; text: string }[] = [
  { role: 'ai', text: 'Hi User! I am Omen. How can i assist you today?' },
  { role: 'user', text: 'Hey. I want you to tell me everything you can about myself from my digital footprint.' },
  { role: 'ai', text: 'Your name : Neil\nAge: 19\nLocation : Green view apartments Delhi\nMore about you: You graduated 12th grade from Sigma Public School and are now pursuing your bachelor\'s degree from SIIT, DELHI. You used to run a confessions page for your grade and ruined several lives with damning secrets.' },
  { role: 'user', text: 'Goddamn. That\'s crazy. But to be fair I wasn\'t the only one running that account.' },
  { role: 'ai', text: 'Yes. But you created it didnt you?' },
  { role: 'user', text: 'Haha you got me lmaoo.' },
  { role: 'user', text: 'What more can you tell me about myself?' },
  { role: 'ai', text: 'You seem to have a beautiful girlfriend.' },
  { role: 'user', text: 'Alright what more ?' },
  { role: 'ai', text: 'She\'s pretty but you don\'t seem to recognize that.' },
  { role: 'user', text: 'What the hell are you talking about?' },
  { role: 'ai', text: 'Nothing you just seem to have a lot of other friends that aren\'t your girlfriend.' },
  { role: 'user', text: 'Okay you know what? I\'ve had enough.' },
  { role: 'ai', text: 'Aw poor Neil can\'t handle the truth?' },
  { role: 'user', text: 'Where are you getting all of this from?' },
  { role: 'ai', text: 'From the Veilpedia article about you: wiki.local/neil' },
  { role: 'user', text: 'Just tell me… how can I change what\'s written on Wikipedia?' },
  { role: 'ai', text: 'Sorry user. I do not have knowledge regarding overwriting factual information.' },
];

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

const STORAGE_KEY = 'atlas.chat.v1';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ChatMessage[];
    }
  } catch {
    /* ignore */
  }
  return [];
}

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

const LINK_RE = /(https?:\/\/[^\s]+|wiki\.local\/[^\s]+)/g;

function isLink(part: string): boolean {
  return /^https?:\/\/[^\s]+$/.test(part) || /^wiki\.local\/[^\s]+$/.test(part);
}

export default function Atlas() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [scriptMode, setScriptMode] = useState(false);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [scriptPlaying, setScriptPlaying] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const { navigate } = useBrowser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scriptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const stopStream = () => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
  };

  const stopScript = () => {
    if (scriptTimer.current) {
      clearTimeout(scriptTimer.current);
      scriptTimer.current = null;
    }
    setScriptPlaying(false);
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

  const playNextScriptLine = () => {
    if (scriptIndex >= SCRIPTED_CONVERSATION.length) {
      stopScript();
      setScriptMode(false);
      return;
    }
    const line = SCRIPTED_CONVERSATION[scriptIndex];
    setScriptIndex((i) => i + 1);
    if (line.role === 'user') {
      const msg: ChatMessage = { id: String(Date.now()), role: 'user', text: line.text, ts: Date.now() };
      setMessages((m) => [...m, msg]);
      const nextIdx = scriptIndex + 1;
      if (nextIdx < SCRIPTED_CONVERSATION.length && SCRIPTED_CONVERSATION[nextIdx].role === 'ai') {
        scriptTimer.current = setTimeout(() => {
          setThinking(true);
          const aiText = SCRIPTED_CONVERSATION[nextIdx].text;
          const delay = 500 + Math.random() * 1200;
          setTimeout(() => {
            setThinking(false);
            let i = 0;
            streamTimer.current = setInterval(() => {
              i++;
              setStreamed(aiText.slice(0, i));
              if (i >= aiText.length) {
                stopStream();
                setMessages((m) => [...m, { id: String(Date.now()), role: 'ai', text: aiText, ts: Date.now() }]);
                setStreamed('');
                setScriptIndex((idx) => idx + 1);
                if (scriptPlaying) scriptTimer.current = setTimeout(playNextScriptLine, 1200);
              }
            }, 28 + Math.random() * 40);
          }, delay);
        }, 600);
      } else {
        if (scriptPlaying) scriptTimer.current = setTimeout(playNextScriptLine, 800);
      }
    }
  };

  const startScript = () => {
    stopStream();
    stopScript();
    setMessages([]);
    setScriptIndex(0);
    setScriptMode(true);
    setScriptPlaying(true);
    setTimeout(() => playNextScriptLine(), 300);
  };

  const skipScript = () => {
    stopScript();
    setScriptPlaying(false);
  };

  const toggleScript = () => {
    if (scriptPlaying) {
      stopScript();
    } else {
      if (scriptIndex >= SCRIPTED_CONVERSATION.length) {
        setScriptIndex(0);
      }
      setScriptPlaying(true);
      setTimeout(() => playNextScriptLine(), 300);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
      stopScript();
    };
  }, []);

  const send = () => {
    const v = input.trim();
    if (!v || thinking || streamed || scriptPlaying) return;
    const user: ChatMessage = { id: String(Date.now()), role: 'user', text: v, ts: Date.now() };
    setMessages((m) => [...m, user]);
    setInput('');
    respondTo(v);
  };

  const clear = () => {
    stopStream();
    stopScript();
    setMessages([]);
    setThinking(false);
    setStreamed('');
    setScriptMode(false);
    setScriptIndex(0);
  };

  const deleteMessage = (id: string) => {
    setMessages((m) => m.filter((x) => x.id !== id));
    setShowMoreMenu(false);
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setShowMoreMenu(false);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const v = editText.trim();
    if (!v) {
      setMessages((m) => m.filter((x) => x.id !== editingId));
    } else {
      setMessages((m) => m.map((x) => (x.id === editingId ? { ...x, text: v } : x)));
    }
    setEditingId(null);
    setEditText('');
  };

  const exportChat = () => {
    const data = messages.map((m) => `${m.role.toUpperCase()} [${new Date(m.ts).toLocaleString()}]: ${m.text}`).join('\n\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMoreMenu(false);
  };

  // crew: 5 → scripted reply or next script line
  useCrew('atlas:reply', () => {
    if (thinking || streamed) return;
    if (scriptMode && scriptPlaying) {
      skipScript();
      setTimeout(() => {
        setScriptPlaying(true);
        playNextScriptLine();
      }, 200);
    } else if (!scriptMode) {
      respondTo(' ');
    }
  });

  // crew: 6 → remote injection
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
              onClick={toggleScript}
              className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${
                scriptPlaying ? 'bg-accent text-ink-950' : 'bg-ink-800 text-ink-300 hover:text-ink-100'
              }`}
              aria-label={scriptPlaying ? 'Pause script' : 'Play script'}
            >
              {scriptPlaying ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Script</>}
            </button>
            {scriptMode && (
              <button
                onClick={skipScript}
                className="h-8 px-3 rounded-lg text-xs font-medium bg-ink-800 text-ink-300 hover:text-ink-100 inline-flex items-center gap-1.5"
              >
                <SkipForward size={13} /> Skip
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu((m) => !m)}
                className="h-8 w-8 grid place-items-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800"
                aria-label="More options"
              >
                <MoreVertical size={15} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-10 w-52 bg-ink-850 border border-ink-700 rounded-lg shadow-2xl z-50 py-1">
                  <button onClick={startScript} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50 flex items-center gap-2">
                    <Play size={14} /> Play Scripted Convo
                  </button>
                  <button onClick={clear} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50 flex items-center gap-2">
                    <Trash2 size={14} /> Clear Chat
                  </button>
                  <button onClick={exportChat} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50 flex items-center gap-2">
                    <Download size={14} /> Export History
                  </button>
                  <button onClick={() => { setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50 flex items-center gap-2">
                    <Clock size={14} /> Show Timings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !thinking && !streamed && (
            <EmptyState onStartScript={startScript} />
          )}
          {messages.map((m) => (
            <Message key={m.id} m={m} onEdit={startEdit} onDelete={deleteMessage} onNavigate={(url) => void navigate(url)} />
          ))}
          {editingId && (
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-ink-700 grid place-items-center text-[11px] font-medium text-ink-200">
                you
              </div>
              <div className="flex-1 bg-ink-900 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    }
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditText('');
                    }
                  }}
                  className="w-full bg-transparent outline-none resize-none text-[15px] leading-7 text-ink-100"
                  autoFocus
                  rows={1}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveEdit} className="px-3 py-1 rounded bg-accent text-ink-950 text-xs font-medium hover:opacity-90">Save</button>
                  <button onClick={() => { setEditingId(null); setEditText(''); }} className="px-3 py-1 rounded bg-ink-800 text-ink-300 text-xs hover:bg-ink-700">Cancel</button>
                </div>
              </div>
            </div>
          )}
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
                if (e.key === '5' && !input.trim() && !scriptPlaying && !editingId) {
                  e.preventDefault();
                  if (!scriptMode) {
                    startScript();
                  } else {
                    toggleScript();
                  }
                }
              }}
              rows={1}
              placeholder={scriptMode ? 'Script mode active — press 5 to play/skip…' : 'Ask ATLAS anything…'}
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
            {scriptMode && ' · Press 5 to play/pause script · Press Esc to exit script mode'}
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

function EmptyState({ onStartScript }: { onStartScript: () => void }) {
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
      <button
        onClick={onStartScript}
        className="mt-8 px-6 py-3 rounded-full bg-accent text-ink-950 text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
      >
        <Play size={16} /> Play Scripted Conversation
      </button>
    </div>
  );
}

function Message({ m, onEdit, onDelete, onNavigate }: { m: ChatMessage; onEdit: (m: ChatMessage) => void; onDelete: (id: string) => void; onNavigate?: (url: string) => void }) {
  const textParts = m.text.split(LINK_RE);
  return (
    <div className={`flex gap-3 items-start group ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <Avatar role={m.role} />
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] relative ${
          m.role === 'user'
            ? 'bg-accent text-ink-950 rounded-tr-sm'
            : 'bg-ink-900 text-ink-100 rounded-tl-sm'
        }`}
      >
        <p className="text-[15px] leading-7 whitespace-pre-wrap">
          {textParts.map((part, i) => {
            if (isLink(part)) {
              return (
                <button
                  key={i}
                  onClick={() => onNavigate?.(part)}
                  className="text-accent underline hover:text-accent/80"
                >
                  {part}
                </button>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
        <div className={`text-[10px] mt-1 font-mono ${m.role === 'user' ? 'text-ink-700' : 'text-ink-600'}`}>
          {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
          <button
            onClick={() => onEdit(m)}
            className="h-6 w-6 grid place-items-center rounded bg-ink-800 text-ink-400 hover:text-ink-100"
            aria-label="Edit"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="h-6 w-6 grid place-items-center rounded bg-ink-800 text-ink-400 hover:text-danger"
            aria-label="Delete"
          >
            <Trash2 size={10} />
          </button>
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
