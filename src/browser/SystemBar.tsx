import { useEffect, useState } from 'react';
import { Battery, Wifi, Volume2 } from 'lucide-react';

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
