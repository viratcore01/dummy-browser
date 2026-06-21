import { Loader2 } from 'lucide-react';

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/60 pointer-events-none">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-accent animate-spin" />
        <div className="text-xs text-ink-400 font-mono tracking-wider uppercase">Loading…</div>
      </div>
    </div>
  );
}
