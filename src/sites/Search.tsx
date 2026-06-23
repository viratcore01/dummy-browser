import { useMemo, useState } from 'react';
import { Search as SearchIcon, ArrowRight, ExternalLink } from 'lucide-react';
import { useActiveEntry, useBrowser } from '../browser/useBrowser';

interface Result {
  title: string;
  url: string;
  nav: string;
  snippet: string;
  host: 'wiki' | 'veil' | 'atlas' | 'error';
}

const CORPUS: Result[] = [
  {
    title: 'Neil (disambiguation) — Veilpedia',
    url: 'wiki.local/neil',
    nav: 'wiki.local › neil',
    snippet:
      'Neil is a given name of Irish/Scottish origin meaning "champion" or "cloud". This article covers the documentary subject of the same name, last seen in the eastern corridor on the night of …',
    host: 'wiki',
  },
  {
    title: 'LIVE — VEIL Broadcast',
    url: 'veil.onion/live',
    nav: 'veil.onion › live',
    snippet:
      'Anonymous relay broadcast. Viewer count fluctuates. Do not interact with the chat. The stream continues regardless of whether you are watching.',
    host: 'veil',
  },
  {
    title: 'ATLAS — Autonomous Reasoning System',
    url: 'atlas.chat',
    nav: 'atlas.chat',
    snippet: 'Ask anything. ATLAS is an experimental conversational system hosted on the local mesh. Responses are generated and may be delayed by network conditions.',
    host: 'atlas',
  },
  {
    title: 'Neil — Corridor Records',
    url: 'archive.local/neil/log',
    nav: 'archive.local › neil › log',
    snippet:
      'Last known transit through the eastern corridor. Entry timestamped but unverifiable. Subsequent entries have been amended by parties unknown.',
    host: 'error',
  },
  {
    title: 'The Corridor Incident — Veilpedia',
    url: 'wiki.local/corridor',
    nav: 'wiki.local › corridor',
    snippet:
      'The Corridor Incident refers to a sequence of events recorded on the night of the broadcast. Accounts differ. The official article has been edited 47 times in the last hour.',
    host: 'wiki',
  },
];

export default function Search() {
  const entry = useActiveEntry();
  const { navigate } = useBrowser();
  const initial = decodeURIComponent(entry?.path || '');
  const [q, setQ] = useState(initial);

  const results = useMemo(() => {
    const term = (q || initial).toLowerCase();
    if (!term) return CORPUS;
    return CORPUS.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.snippet.toLowerCase().includes(term) ||
        r.url.includes(term),
    );
  }, [q, initial]);

  return (
    <div className="min-h-full">
      <div className="border-b border-ink-800 px-6 py-4 flex items-center gap-4">
        <span className="text-2xl font-light tracking-[0.25em] text-accent">BROWSE</span>
        <div className="flex-1 max-w-2xl flex items-center h-11 bg-ink-850 rounded-full px-4 ring-1 ring-ink-700">
          <SearchIcon size={15} className="text-ink-400 mr-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) void navigate(q);
            }}
            className="flex-1 bg-transparent outline-none text-sm text-ink-50"
            autoFocus
          />
        </div>
      </div>

      <div className="max-w-2xl px-6 py-6">
        <div className="text-xs text-ink-500 mb-6">
          About {results.length * 18 + 4} results · sorted by relevance · (0.{Math.floor(Math.random() * 89 + 10)}s)
        </div>

        <div className="space-y-7">
          {results.map((r) => (
            <div key={r.url} className="group">
              <div className="text-[11px] text-ink-500 font-mono mb-0.5">{r.nav}</div>
              <button
                onClick={() => void navigate(r.url)}
                className="text-xl text-ink-100 group-hover:text-accent transition-colors text-left flex items-start gap-1"
              >
                {r.title}
                <ExternalLink size={13} className="opacity-0 group-hover:opacity-60 mt-2" />
              </button>
              <p className="text-sm text-ink-300 mt-1 leading-relaxed">{r.snippet}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ink-800 flex items-center gap-3 text-xs text-ink-400">
          <span>Related searches:</span>
          {['who is neil', 'corridor incident', 'veil.onion/live', 'atlas.chat'].map((s) => (
            <button
              key={s}
              onClick={() => void navigate(s)}
              className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-ink-850 hover:bg-ink-800 text-ink-300"
            >
              {s} <ArrowRight size={11} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
