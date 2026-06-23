import { useEffect, useRef, useState } from 'react';
import { Users, Send, Shield } from 'lucide-react';
import { useBrowser } from '../browser/useBrowser';
import { useCrew } from '../browser/useBrowser';

interface ChatLine {
  id: number;
  user: string;
  text: string;
  color: string;
}

const INITIAL_CHAT: ChatLine[] = [
  { id: 1, user: 'echo', text: 'did anyone else catch that at 02:14?', color: 'text-accent' },
  { id: 2, user: 'whisper_07', text: 'the figure moved when the light flickered', color: 'text-warn' },
  { id: 3, user: 'n0_name', text: 'i rewatched it 3 times. same corridor.', color: 'text-ink-300' },
  { id: 4, user: 'redact', text: 'this broadcast feels targeted', color: 'text-danger' },
  { id: 5, user: 'anon', text: 'i posted the clip on wiki.local but it was removed', color: 'text-ink-300' },
];

export default function Community() {
  const [chat, setChat] = useState<ChatLine[]>(INITIAL_CHAT);
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [profileGone, setProfileGone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { navigate } = useBrowser();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const send = () => {
    const v = input.trim();
    if (!v) return;
    setChat((c) => [...c.slice(-40), { id: Date.now() + Math.random(), user: 'you', text: v, color: 'text-accent' }]);
    setInput('');
  };

  // crew: key 9 → someone posts ATLAS link
  useCrew('veil:atlas-link', () => {
    setChat((c) => [
      ...c.slice(-40),
      { id: Date.now() + Math.random(), user: 'echo', text: 'hey check out this AI i found atlas.chat', color: 'text-accent' },
    ]);
  });

  // crew: key 6 → profile gone (if profile is open, mark it as gone)
  useCrew('veil:profile-gone', () => {
    setProfileGone(true);
    // Also open profile overlay if not already open
    if (!showProfile) {
      setShowProfile(true);
    }
  });

  const openProfile = () => {
    setProfileGone(false);
    setShowProfile(true);
  };

  return (
    <div className="h-full bg-black text-ink-100 flex flex-col">
      <div className="h-11 px-4 border-b border-ink-800 flex items-center gap-2">
        <Users size={14} className="text-accent" />
        <span className="text-sm font-medium">Community Chat</span>
        <span className="text-[10px] text-ink-500">{chat.length} messages</span>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 no-scrollbar">
        {chat.map((m) => (
          <div key={m.id} className="text-[13px] leading-snug">
            <span className={`font-mono ${m.color}`}>{m.user}</span>
            <span className="text-ink-300 ml-2 break-words">
              {m.text.includes('atlas.chat') ? (
                <button onClick={openProfile} className="text-accent underline hover:text-accent/80">
                  {m.text}
                </button>
              ) : (
                m.text
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-ink-800">
        <div className="flex items-center gap-2 bg-ink-850 rounded-lg px-3 h-10 ring-1 ring-ink-700 focus-within:ring-accent/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Discuss the broadcast…"
            className="flex-1 bg-transparent outline-none text-sm text-ink-100 placeholder:text-ink-600"
          />
          <button onClick={send} className="text-ink-400 hover:text-accent">
            <Send size={15} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-ink-600 font-mono text-center">
          anonymous · join the discussion
        </div>
      </div>
      {showProfile && (
        <ProfileOverlay
          gone={profileGone}
          onClose={() => setShowProfile(false)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}

interface ProfileOverlayProps {
  gone: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

function ProfileOverlay({ gone, onClose, onNavigate }: ProfileOverlayProps) {
  if (gone) {
    return (
      <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-danger mx-auto mb-4" />
          <div className="text-xl font-medium text-ink-100 mb-2">Profile Unavailable</div>
          <div className="text-sm text-ink-400">This profile no longer exists.</div>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded bg-ink-800 text-ink-200 text-sm hover:bg-ink-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-ink-700 rounded-xl max-w-sm w-full p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-ink-700 grid place-items-center text-lg font-serif text-ink-300">E</div>
          <div>
            <div className="text-lg font-medium text-ink-100">echo</div>
            <div className="text-[11px] text-ink-500 font-mono">joined 2 hours ago</div>
          </div>
        </div>
        <div className="text-sm text-ink-300 mb-4">
          Obsessed with the corridor broadcast. Still rewatching the 02:14 timestamp.
        </div>
        <div className="text-[11px] text-ink-500 mb-4">
          <span className="text-ink-400">Posted:</span> atlas.chat · 2 hours ago
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void onNavigate('atlas.chat')}
            className="flex-1 px-3 py-2 rounded bg-accent text-ink-950 text-sm hover:opacity-90"
          >
            Open ATLAS
          </button>
          <button onClick={onClose} className="px-3 py-2 rounded bg-ink-800 text-ink-300 text-sm hover:bg-ink-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}