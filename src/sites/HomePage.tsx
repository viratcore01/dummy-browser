import { useState } from 'react';
import { Search, Lock, Globe, Eye, Skull, BookOpen } from 'lucide-react';
import { useBrowser } from '../browser/store';

const QUICK = [
  { label: 'Omen Chat', url: 'omen.chat', hint: 'omen.chat', icon: 'eye', color: 'text-purple-400' },
  { label: 'Wikipedia', url: 'en.wikipedia.org/wiki/Neil_Sharma', hint: 'wikipedia.org', icon: 'book', color: 'text-blue-400' },
  { label: 'DarkWeb Violence', url: 'darkweb-violence.onion/live', hint: 'darkweb-violence.onion', icon: 'skull', color: 'text-red-500' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  eye: <Eye size={11} />,
  skull: <Skull size={11} />,
  book: <BookOpen size={11} />,
};

export default function HomePage() {
  const { navigate } = useBrowser();
  const [q, setQ] = useState('');

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    void navigate(v);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 relative">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 30%, #7dd3c0 0%, transparent 60%)',
      }} />

      <div className="relative flex flex-col items-center w-full max-w-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="relative">
            <Globe size={52} strokeWidth={1.1} className="text-accent" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#7dd3c0]" />
          </div>
          <h1 className="text-5xl font-light tracking-[0.3em] text-ink-50">BROWSE</h1>
        </div>

        <form onSubmit={submit} className="w-full relative">
          <div className="flex items-center h-14 bg-ink-850 rounded-full px-6 ring-1 ring-ink-700 focus-within:ring-accent/60 transition">
            <Search size={18} className="text-ink-400 mr-3 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the network or type a URL"
              className="flex-1 bg-transparent outline-none text-base text-ink-50 placeholder:text-ink-500"
              spellCheck={false}
              autoCapitalize="off"
              autoFocus
            />
            {q && (
              <button
                type="submit"
                className="ml-3 h-9 px-5 rounded-full bg-accent text-ink-950 text-sm font-medium hover:opacity-90"
              >
                Search
              </button>
            )}
          </div>
        </form>

        <div className="mt-10 flex flex-wrap gap-2 justify-center">
          {QUICK.map((s) => (
            <button
              key={s.url}
              onClick={() => void navigate(s.url)}
              className="group flex items-center gap-2 px-3.5 h-9 rounded-full bg-ink-850 hover:bg-ink-800 ring-1 ring-ink-700 hover:ring-ink-600 transition"
            >
              <span className={s.color}>{ICON_MAP[s.icon] || <Lock size={11} />}</span>
              <span className="text-sm text-ink-200 group-hover:text-ink-50">{s.label}</span>
              <span className="text-[11px] text-ink-500 font-mono">{s.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-16 text-[11px] text-ink-600 font-mono text-center">
          browse:// — a peaceful network. <span className="text-ink-500">nodes online: 3</span>
        </div>
      </div>
    </div>
  );
}
