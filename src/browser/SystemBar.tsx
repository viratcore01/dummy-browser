import { useEffect, useState } from 'react';
import { Battery, Wifi, Volume2 } from 'lucide-react';
import { useBrowser } from './useBrowser';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

export default function SystemBar() {
  const now = useClock();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [battery] = useState(() => 62 + Math.floor(Math.random() * 35));
  const [wifi] = useState(true);
  const [vol] = useState(48);

  return (
    <div className="flex items-center justify-between px-3 h-7 bg-ink-950/95 text-ink-200 text-[11px] select-none border-b border-ink-800">
      <div className="flex items-center gap-3">
        <span className="text-accent font-semibold tracking-wide">VEIL</span>
        <span className="text-ink-400 font-mono">v3.1.0</span>
      </div>
      <div className="flex items-center gap-3 text-ink-300">
        <Volume2 size={12} className={vol > 0 ? 'text-ink-200' : 'text-ink-500'} />
        <Wifi size={13} className={wifi ? 'text-accent' : 'text-ink-500'} />
        <span className="tabular-nums">{time}</span>
        <Battery size={14} className="text-ink-200" />
        <span className="tabular-nums text-ink-200">{battery}%</span>
      </div>
    </div>
  );
}

export function NotificationStack() {
  const { active } = useBrowser();
  const [notes, setNotes] = useState<{ id: number; title: string; body: string; from: string }[]>([]);

  useEffect(() => {
    const handler = (p: unknown) => {
      const payload = p as { title?: string; body?: string; from?: string } | undefined;
      const id = Date.now() + Math.random();
      const note = {
        id,
        title: payload?.title ?? 'Veil',
        body: payload?.body ?? '',
        from: payload?.from ?? 'system',
      };
      setNotes((n) => [...n, note].slice(-3));
      setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 5200);
    };
    // listen via custom window event because crew controls bypass provider sometimes
    window.addEventListener('veil:notify', (e) => handler((e as CustomEvent).detail));
    return () => window.removeEventListener('veil:notify', (e) => handler((e as CustomEvent).detail));
  }, [active?.id]);

  return (
    <div className="absolute top-10 right-3 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      {notes.map((n) => (
        <div
          key={n.id}
          className="bg-ink-850/95 backdrop-blur border border-ink-700 rounded-lg p-3 shadow-2xl animate-[scan_2s_ease-out_forwards] origin-top-right"
          style={{ animation: 'scaleIn 0.18s ease-out' }}
        >
          <div className="flex items-center justify-between text-[10px] text-ink-400 uppercase tracking-wider mb-1">
            <span>{n.from}</span>
            <span className="text-accent">now</span>
          </div>
          <div className="text-sm font-medium text-ink-50">{n.title}</div>
          {n.body && <div className="text-xs text-ink-300 mt-0.5 line-clamp-2">{n.body}</div>}
        </div>
      ))}
      <style>{`@keyframes scaleIn{from{opacity:0;transform:translateY(-6px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}
