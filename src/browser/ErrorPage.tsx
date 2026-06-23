import { Compass, AlertTriangle } from 'lucide-react';
import { useActiveEntry, useBrowser } from './useBrowser';

export default function ErrorPage() {
  const entry = useActiveEntry();
  const { navigate } = useBrowser();

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 text-danger">
        <AlertTriangle size={56} strokeWidth={1.2} />
      </div>
      <div className="text-2xl font-semibold text-ink-100 mb-2">This page can't be reached</div>
      <div className="text-sm text-ink-400 max-w-md mb-1">
        <span className="font-mono text-warn">{entry?.path}</span> took too long to respond or doesn't exist on this network.
      </div>
      <div className="text-xs text-ink-500 mb-8 font-mono">ERR_HOST_UNREACHABLE · 0x2E3</div>

      <div className="flex gap-2">
        <button
          onClick={() => void navigate('home')}
          className="px-4 h-9 rounded-full bg-accent text-ink-950 text-sm font-medium hover:opacity-90"
        >
          Go to start page
        </button>
        <button
          onClick={() => void navigate('wiki.local/neil')}
          className="px-4 h-9 rounded-full bg-ink-800 text-ink-200 text-sm hover:bg-ink-750 inline-flex items-center gap-2"
        >
          <Compass size={14} /> Try Veilpedia
        </button>
      </div>

      <div className="mt-12 text-[11px] text-ink-600 font-mono">
        Veil Browser · connection secured · exit node: unknown
      </div>
    </div>
  );
}
