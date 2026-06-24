import { useEffect, useRef, useState } from 'react';
import { Users, Send, Maximize, Volume2, VolumeX, Circle, Pause, Play } from 'lucide-react';
import { useBrowser, useCrew } from '../browser/useBrowser';

interface ChatLine {
  id: number;
  user: string;
  text: string;
  color: string;
}

const USERS = [
  'n0_name', 'redact', 'whisper_07', 'anon', 'witness_b', 'k.412', '__', 'echo', 'visitor',
];
const COLORS = ['text-accent', 'text-warn', 'text-ink-100', 'text-ink-300', 'text-danger'];
const LINES = [
  'what',
  'is that him',
  'dont move the camera',
  'who is recording this',
  'the lights',
  'he knows',
  'keep watching',
  'this is not in the file',
  'there are too many of us',
  'turn it off',
  'why is the count going up',
  'i was told not to look',
  'same corridor',
  'its still there',
  'did anyone else see 2:14',
  'he looked up',
  'no sound.',
];

const SEED_CHAT: ChatLine[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  user: USERS[i % USERS.length],
  text: LINES[i % LINES.length],
  color: COLORS[i % COLORS.length],
}));

function rPick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export default function Livestream() {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [viewers, setViewers] = useState(247);
  const [chat, setChat] = useState<ChatLine[]>(SEED_CHAT);
  const [recording, setRecording] = useState(true);
  const [elapsed, setElapsed] = useState(6324); // seconds since stream start
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLDivElement>(null);
  const { navigate } = useBrowser();

  // auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  // clock
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // chat ticker
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const delay = 1800 + Math.random() * 4200;
      id = setTimeout(() => {
        setChat((c) => [
          ...c.slice(-40),
          { id: Date.now() + Math.random(), user: rPick(USERS), text: rPick(LINES), color: rPick(COLORS) },
        ]);
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  // viewer count drift
  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => {
        const delta = Math.floor(Math.random() * 7) - 2;
        return Math.max(120, v + delta);
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);

  // random buffering for tension
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 12000 + Math.random() * 20000;
      id = setTimeout(() => {
        setBuffering(true);
        // flicker recording too
        if (Math.random() < 0.25) setRecording(false);
        setTimeout(() => {
          setBuffering(false);
          setRecording(true);
          schedule();
        }, 1400 + Math.random() * 2600);
      }, delay);
    };
    schedule();
    return () => clearTimeout(id);
  }, []);

  // crew: 4 → bump viewers
  useCrew('veil:viewers', () => setViewers((v) => v + Math.floor(Math.random() * 20 + 8)));

  // crew: 7 → inject chat message
  useCrew('livestream:inject', (payload: { text: string; user: string; color: string }) => {
    setChat((c) => [
      ...c.slice(-40),
      { id: Date.now() + Math.random(), user: payload.user, text: payload.text, color: payload.color },
    ]);
  });

  const send = () => {
    const v = input.trim();
    if (!v) return;
    setChat((c) => [...c.slice(-40), { id: Date.now(), user: 'you', text: v, color: 'text-accent' }]);
    setInput('');
  };

  const ts = fmtTime(elapsed);

  return (
    <div className="h-full bg-black text-ink-100 flex flex-col">
      <div className="flex-1 grid lg:grid-cols-[1fr_320px] min-h-0">
        {/* Video stage */}
        <div className="relative bg-black min-h-0 flex flex-col">
          <div
            ref={vidRef}
            className="relative flex-1 bg-black overflow-hidden grid place-items-center"
          >
            {/* Background "video": dark corridor gradient with scanlines */}
            <VideoBackdrop buffering={buffering} />

            {/* Recording badge */}
            {recording && (
              <div className="absolute top-3 left-4 flex items-center gap-1.5 z-20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
                </span>
                <span className="text-[11px] font-mono text-danger tracking-wider">REC</span>
                <span className="text-[11px] font-mono text-ink-400 ml-2">REC_OUT_02.cam</span>
              </div>
            )}

            {/* Live badge */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-danger/90 px-2 py-0.5 rounded z-20">
              <Circle size={8} fill="currentColor" className="text-white" />
              <span className="text-[11px] font-semibold text-white tracking-wide">LIVE</span>
            </div>

            {/* Viewer count */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur px-2 py-1 rounded">
              <Users size={12} className="text-ink-300" />
              <span className="text-xs font-mono text-ink-100 tabular-nums">{viewers}</span>
              <span className="text-[10px] text-ink-500">watching</span>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-3 left-4 z-20 font-mono text-[11px] text-ink-400">
              <span className="text-ink-500">TS</span> {ts} <span className="text-ink-600">· 02:14 LOCAL</span>
            </div>

            {/* Buffering overlay */}
            {buffering && (
              <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                <div className="text-warn font-mono text-sm tracking-widest animate-pulse">BUFFERING…</div>
                <div className="w-40 h-0.5 bg-ink-800 overflow-hidden rounded">
                  <div className="h-full w-1/2 bg-warn animate-barber" />
                </div>
              </div>
            )}

            {/* Play overlay when paused */}
            {!playing && !buffering && (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 z-30 grid place-items-center bg-black/40"
              >
                <div className="h-16 w-16 rounded-full bg-ink-850/90 grid place-items-center">
                  <Play size={28} className="text-ink-100 ml-1" fill="currentColor" />
                </div>
              </button>
            )}

            {/* VHS overlay */}
            <div className="absolute inset-0 pointer-events-none vhs-line opacity-40" />
            <div className="absolute inset-0 pointer-events-none noise-overlay" />
          </div>

          {/* Player controls */}
          <div className="h-12 bg-ink-950 border-t border-ink-900 flex items-center px-4 gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="text-ink-300 hover:text-ink-50"
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => setMuted((m) => !m)} className="text-ink-300 hover:text-ink-50">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1 mx-2 h-0.5 bg-ink-800 rounded relative">
              <div className="absolute inset-y-0 left-0 w-3/4 bg-danger rounded" />
            </div>
            <span className="text-[11px] font-mono text-ink-500 tabular-nums">∞ / ∞</span>
            <button className="text-ink-300 hover:text-ink-50">
              <Maximize size={15} />
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex flex-col bg-ink-900 border-l border-ink-800 min-h-0">
          <div className="h-11 px-4 border-b border-ink-800 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-100">Live Chat</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void navigate('community.local')}
                className="text-[11px] text-accent hover:text-accent/80 font-mono"
              >
                Community
              </button>
              <span className="text-[11px] text-ink-500 font-mono">{chat.length} messages</span>
            </div>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 no-scrollbar">
            {chat.map((m) => (
              <div key={m.id} className="text-[13px] leading-snug" style={{ animation: 'fadeInUp 0.18s ease-out' }}>
                <span className={`font-mono ${m.color}`}>{m.user}</span>
                <span className="text-ink-300 ml-2 break-words">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-ink-800">
            <div className="flex items-center gap-2 bg-ink-850 rounded-lg px-3 h-10 ring-1 ring-ink-700 focus-within:ring-accent/40">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Send a message…"
                className="flex-1 bg-transparent outline-none text-sm text-ink-100 placeholder:text-ink-600"
              />
              <button onClick={send} className="text-ink-400 hover:text-accent">
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-ink-600 font-mono text-center">
              messages are not stored · network: hidden
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function fmtTime(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function VideoBackdrop({ buffering }: { buffering: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Corridor: receding rectangles */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${buffering ? 'opacity-30' : 'opacity-100'}`}
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, #0e1216 0%, #050608 70%)',
        }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {/* receding corridor walls */}
        {[60, 45, 33, 24, 17, 12, 8, 5].map((w, i) => {
          const x = (100 - w) / 2;
          const opacity = 0.12 + i * 0.07;
          return (
            <rect
              key={w}
              x={x}
              y={(100 - w) / 2}
              width={w}
              height={w}
              fill="none"
              stroke="#5a6273"
              strokeWidth="0.3"
              opacity={opacity}
            />
          );
        })}
        {/* end figure (Neil silhouette, suggested) */}
        <g opacity="0.45">
          <ellipse cx="50" cy="50" rx="1.6" ry="2.2" fill="#9aa3b2" />
          <path d="M46.5 54 Q50 50.5 53.5 54 L53.5 58 Q50 57 46.5 58 Z" fill="#9aa3b2" />
        </g>
      </svg>

      {/* faint vignette pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </div>
  );
}
