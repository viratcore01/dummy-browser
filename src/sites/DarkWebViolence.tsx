import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pause, Play, Maximize, Volume2, VolumeX, Circle, Users, Send,
  Skull, AlertTriangle, Radio
} from 'lucide-react';
import { useCrew } from '../browser/store';
import scriptData from '../data/script.json';

interface ChatLine {
  id: number;
  user: string;
  text: string;
  color: string;
  isSpecial?: boolean;
}

const AMBIENT = scriptData.darkweb.ambient_messages;
const INITIAL_CHAT: ChatLine[] = scriptData.darkweb.initial_chat.map((m, i) => ({
  id: i,
  user: m.user,
  text: m.text,
  color: m.color,
  isSpecial: false,
}));

const COLOR_MAP: Record<string, string> = {
  red: 'text-red-500',
  gray: 'text-gray-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  purple: 'text-purple-400',
  white: 'text-white',
};

function rPick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export default function DarkWebViolence() {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [viewers, setViewers] = useState(1847);
  const [chat, setChat] = useState<ChatLine[]>(INITIAL_CHAT);
  const [recording, setRecording] = useState(true);
  const [elapsed, setElapsed] = useState(4218);
  const [input, setInput] = useState('');
  const [showWarning, setShowWarning] = useState(true);
  const [intensity, setIntensity] = useState(0); // 0-3, increases with livestream events
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  // Clock
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  // Ambient chat ticker
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const delay = 2400 + Math.random() * 5000;
      id = setTimeout(() => {
        const msg = rPick(AMBIENT);
        setChat(c => [
          ...c.slice(-60),
          {
            id: Date.now() + Math.random(),
            user: msg.user,
            text: msg.text,
            color: msg.color,
          },
        ]);
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  // Viewer count drift
  useEffect(() => {
    const id = setInterval(() => {
      setViewers(v => {
        const delta = Math.floor(Math.random() * 12) - 3;
        return Math.max(800, v + delta);
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Director: F3 → scripted chat message
  useCrew('darkweb:chat', (payload) => {
    const msg = payload as { user: string; text: string; color: string; isSpecial?: boolean };
    if (!msg) return;
    setChat(c => [
      ...c.slice(-60),
      {
        id: Date.now() + Math.random(),
        user: msg.user,
        text: msg.text,
        color: msg.color,
        isSpecial: msg.isSpecial,
      },
    ]);
    // Flash effect for special messages
    if (msg.isSpecial) {
      document.body.classList.add('darkweb-flash');
      setTimeout(() => document.body.classList.remove('darkweb-flash'), 300);
    }
  });

  // Director: F4 → bump viewers
  useCrew('darkweb:viewers', () => {
    setViewers(v => v + Math.floor(Math.random() * 80 + 30));
  });

  // Director: F7 → buffering
  useCrew('darkweb:buffer', () => {
    setBuffering(true);
    if (Math.random() < 0.3) setRecording(false);
    setTimeout(() => {
      setBuffering(false);
      setRecording(true);
    }, 1800 + Math.random() * 2000);
  });

  // Director: Space → livestream event (increase intensity)
  useCrew('darkweb:livestream-event', () => {
    setIntensity(i => Math.min(i + 1, 3));
    // Brief screen distortion
    setBuffering(true);
    setTimeout(() => setBuffering(false), 600);
    // Bump viewers dramatically
    setViewers(v => v + Math.floor(Math.random() * 200 + 50));
  });

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  const sendChat = () => {
    const v = input.trim();
    if (!v) return;
    setChat(c => [...c.slice(-60), { id: Date.now(), user: 'you', text: v, color: 'green' }]);
    setInput('');
  };

  const ts = fmtTime(elapsed);

  // Entry warning
  if (showWarning) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-3 tracking-wider">WARNING</h2>
          <p className="text-sm text-red-800 mb-2 leading-relaxed">
            You are about to access an unverified .onion relay broadcast.
            Content may be disturbing. Connection is not encrypted on your end.
          </p>
          <p className="text-[10px] text-red-900 font-mono mb-6">
            IP: 192.168.xx.xx · EXIT NODE: UNKNOWN · TOR: DISCONNECTED
          </p>
          <button
            onClick={dismissWarning}
            className="px-6 py-2 bg-red-900/40 border border-red-800/50 text-red-400 rounded hover:bg-red-900/60 text-sm font-mono tracking-wider"
          >
            ENTER ANYWAY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-gray-100 flex flex-col">
      {/* Site header bar */}
      <div className="h-9 bg-[#0a0505] border-b border-red-900/20 flex items-center px-4 gap-3">
        <Skull size={14} className="text-red-600" />
        <span className="text-[11px] font-mono text-red-700 tracking-wider">DARKWEB-VIOLENCE.ONION</span>
        <span className="flex-1" />
        <span className="text-[10px] text-red-900 font-mono">TOR · UNVERIFIED · {viewers} connected</span>
        <Radio size={12} className="text-red-600 animate-pulse" />
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_340px] min-h-0">
        {/* Video stage */}
        <div className="relative bg-black min-h-0 flex flex-col">
          <div className="relative flex-1 bg-black overflow-hidden grid place-items-center">
            <VideoBackdrop buffering={buffering} intensity={intensity} />

            {/* Recording badge */}
            {recording && (
              <div className="absolute top-3 left-4 flex items-center gap-1.5 z-20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                <span className="text-[11px] font-mono text-red-500 tracking-wider">REC</span>
                <span className="text-[11px] font-mono text-red-900 ml-2">CAM_0{intensity + 1}.feed</span>
              </div>
            )}

            {/* LIVE badge */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-red-700/90 px-2 py-0.5 rounded z-20">
              <Circle size={8} fill="currentColor" className="text-white" />
              <span className="text-[11px] font-semibold text-white tracking-wide">LIVE</span>
            </div>

            {/* Viewers */}
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-20 bg-black/60 backdrop-blur px-2 py-1 rounded">
              <Users size={12} className="text-red-400" />
              <span className="text-xs font-mono text-red-300 tabular-nums">{viewers.toLocaleString()}</span>
              <span className="text-[10px] text-red-800">watching</span>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-3 left-4 z-20 font-mono text-[11px] text-red-800">
              <span className="text-red-900">TS</span> {ts}
            </div>

            {/* Buffering */}
            {buffering && (
              <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                <div className="text-red-500 font-mono text-sm tracking-widest animate-pulse">BUFFERING…</div>
                <div className="w-40 h-0.5 bg-red-950 overflow-hidden rounded">
                  <div className="h-full w-1/2 bg-red-600 rounded animate-barber" />
                </div>
              </div>
            )}

            {/* Pause overlay */}
            {!playing && !buffering && (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 z-30 grid place-items-center bg-black/50"
              >
                <div className="h-16 w-16 rounded-full bg-red-950/80 grid place-items-center border border-red-800/30">
                  <Play size={28} className="text-red-400 ml-1" fill="currentColor" />
                </div>
              </button>
            )}

            {/* VHS effects */}
            <div className="absolute inset-0 pointer-events-none vhs-line opacity-30" />
            <div className="absolute inset-0 pointer-events-none noise-overlay" />
          </div>

          {/* Player controls */}
          <div className="h-12 bg-[#080303] border-t border-red-900/20 flex items-center px-4 gap-3">
            <button onClick={() => setPlaying(p => !p)} className="text-red-700 hover:text-red-400">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => setMuted(m => !m)} className="text-red-700 hover:text-red-400">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex-1 mx-2 h-0.5 bg-red-950 rounded relative">
              <div className="absolute inset-y-0 left-0 bg-red-700 rounded" style={{ width: `${Math.min(95, (elapsed / 7200) * 100)}%` }} />
            </div>
            <span className="text-[11px] font-mono text-red-800 tabular-nums">∞ / ∞</span>
            <button className="text-red-700 hover:text-red-400">
              <Maximize size={15} />
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex flex-col bg-[#080505] border-l border-red-900/20 min-h-0">
          <div className="h-11 px-4 border-b border-red-900/20 flex items-center justify-between">
            <span className="text-sm font-medium text-red-400">Live Chat</span>
            <span className="text-[11px] text-red-900 font-mono">{chat.length} msgs</span>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 no-scrollbar">
            {chat.map((m) => (
              <div
                key={m.id}
                className={`text-[13px] leading-snug ${m.isSpecial ? 'py-1 px-2 bg-purple-950/40 border border-purple-900/30 rounded' : ''}`}
                style={{ animation: 'fadeInUp 0.15s ease-out' }}
              >
                <span className={`font-mono ${COLOR_MAP[m.color] || 'text-gray-500'} ${m.isSpecial ? 'font-bold' : ''}`}>
                  {m.user}
                </span>
                <span className={`ml-2 break-words ${m.isSpecial ? 'text-purple-300' : 'text-gray-400'}`}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-red-900/20">
            <div className="flex items-center gap-2 bg-[#0f0808] rounded-lg px-3 h-10 ring-1 ring-red-900/30 focus-within:ring-red-700/40">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Send a message…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder:text-red-900/50"
              />
              <button onClick={sendChat} className="text-red-700 hover:text-red-400">
                <Send size={15} />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-red-900/50 font-mono text-center">
              messages are not stored · connection: hidden relay
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .darkweb-flash {
          animation: dwFlash 0.3s ease-out;
        }
        @keyframes dwFlash {
          0% { filter: brightness(1); }
          50% { filter: brightness(2) hue-rotate(20deg); }
          100% { filter: brightness(1); }
        }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 128px;
        }
        .vhs-line {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,0,0,0.03) 2px,
            rgba(255,0,0,0.03) 4px
          );
        }
      `}</style>
    </div>
  );
}

function fmtTime(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function VideoBackdrop({ buffering, intensity }: { buffering: boolean; intensity: number }) {
  // Intensity changes the visual: darker, more distorted, reddish tint
  const tint = intensity === 0
    ? 'rgba(10,5,5,0.9)'
    : intensity === 1
    ? 'rgba(20,5,5,0.85)'
    : intensity === 2
    ? 'rgba(30,5,5,0.8)'
    : 'rgba(40,0,0,0.75)';

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center bg-black">
      <div
        className={`absolute inset-0 transition-all duration-1000 ${buffering ? 'opacity-30' : 'opacity-100'}`}
        style={{
          background: `radial-gradient(ellipse at 50% 55%, ${tint} 0%, #020101 70%)`,
        }}
      />
      
      {/* Background Grid & Vector Corridor */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        {/* Grid lines */}
        <g opacity="0.05" stroke="#ff0000" strokeWidth="0.1">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" />
          ))}
        </g>

        {[60, 45, 33, 24, 17, 12, 8, 5].map((w, i) => {
          const x = (100 - w) / 2;
          const opacity = 0.05 + i * 0.04;
          return (
            <rect
              key={w}
              x={x}
              y={(100 - w) / 2}
              width={w}
              height={w}
              fill="none"
              stroke={intensity > 1 ? '#ef4444' : '#7f1d1d'}
              strokeWidth="0.2"
              opacity={opacity}
            />
          );
        })}

        {/* Silhouette Figure */}
        {intensity === 0 && (
          <g opacity="0.4" className="transition-opacity duration-700">
            <ellipse cx="50" cy="48" rx="1.8" ry="2.5" fill="#3a2020" />
            <path d="M46 54 Q50 50 54 54 L54 60 Q50 59 46 60 Z" fill="#3a2020" />
          </g>
        )}

        {/* Intensity 1: Suyanshi Revealed */}
        {intensity >= 1 && (
          <g className="transition-all duration-700">
            {/* Bound victim chair silhouette */}
            <rect x="48" y="55" width="4" height="15" fill="#201010" opacity="0.7" />
            <ellipse cx="50" cy="50" rx="2.5" ry="3.5" fill="#502020" />
            <path d="M44 58 Q50 55 56 58 L55 70 L45 70 Z" fill="#502020" />
            {/* Gag / Blindfold line */}
            <line x1="48" y1="49.5" x2="52" y2="49.5" stroke="#ef4444" strokeWidth="0.4" />
          </g>
        )}

        {/* Intensity 2: Kritika Revealed */}
        {intensity >= 2 && (
          <g className="transition-all duration-700">
            {/* Second bound chair silhouette */}
            <rect x="36" y="56" width="3" height="14" fill="#201010" opacity="0.7" />
            <ellipse cx="37.5" cy="51" rx="2" ry="3" fill="#601515" />
            <path d="M33 58 Q37.5 56 42 58 L41 68 L34 68 Z" fill="#601515" />
            <line x1="36" y1="50.5" x2="39" y2="50.5" stroke="#ef4444" strokeWidth="0.3" />
          </g>
        )}
      </svg>

      {/* Screen text details */}
      <div className="absolute top-12 left-4 font-mono text-[9px] text-red-500/60 space-y-1 z-10 pointer-events-none">
        <div>AUDIO: {intensity > 0 ? 'FEED_LIVE_48KHZ' : 'MUTE_SYS'}</div>
        <div>SIGNAL: OUTGOING_RELAY_3_HOP</div>
        {intensity >= 1 && <div className="text-red-400 font-bold animate-pulse">WARNING: TARGET_01 SUYANSHI [CAPTURED]</div>}
        {intensity >= 2 && <div className="text-red-400 font-bold animate-pulse">WARNING: TARGET_02 KRITIKA [CAPTURED]</div>}
      </div>

      {/* Hammer impact animation overlay */}
      {intensity >= 3 && (
        <div 
          className="absolute inset-0 z-40 bg-red-950/90 flex flex-col items-center justify-center animate-flash-impact"
          style={{
            animation: 'flashImpact 0.4s ease-out infinite'
          }}
        >
          <div className="text-white font-mono text-2xl font-bold tracking-widest bg-red-700 px-4 py-2 border border-white/50 shadow-2xl">
            CRITICAL_IMPACT_SYNCED
          </div>
          <div className="text-[10px] text-red-300 font-mono mt-2 animate-pulse">
            HAMMER_IMPACT_CAM_01.EXE · RUNNING
          </div>
        </div>
      )}

      {/* Blood-red vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(${intensity * 50},0,0,0.6) 100%)`,
        }}
      />
      {/* Scanline flicker */}
      {intensity > 0 && (
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ 
            background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,0,0,0.1) 1px, rgba(255,0,0,0.1) 2px)',
            animation: 'scanMove 0.1s linear infinite'
          }}
        />
      )}

      <style>{`
        @keyframes flashImpact {
          0% { background-color: rgba(127, 29, 29, 0.95); filter: invert(0); }
          50% { background-color: rgba(220, 38, 38, 0.98); filter: invert(0.8) contrast(2); }
          100% { background-color: rgba(127, 29, 29, 0.95); filter: invert(0); }
        }
      `}</style>
    </div>
  );
}
