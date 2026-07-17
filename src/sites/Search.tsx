import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, ArrowRight, ExternalLink, Clock3, History, X, RotateCcw } from 'lucide-react';
import { useActiveEntry, useBrowser, useCrew } from '../browser/store';

interface Result {
  title: string;
  url: string;
  nav: string;
  snippet: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  ts: number;
}

const HISTORY_KEY = 'veil.search.history.v1';
const HISTORY_BACKUP_KEY = 'veil.search.history.backup.v1';

function makeDefaultHistory(): SearchHistoryItem[] {
  const now = Date.now();
  return [
    { id: 'h1', query: 'buy drug ...', ts: now - 1000 * 60 * 52 },
    { id: 'h2', query: 'suyanshi dm ...', ts: now - 1000 * 60 * 41 },
    { id: 'h3', query: 'steroids ...', ts: now - 1000 * 60 * 29 },
    { id: 'h4', query: 'dark web violence ...', ts: now - 1000 * 60 * 12 },
  ];
}

function loadHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as SearchHistoryItem[];
  } catch {
    /* ignore */
  }
  return makeDefaultHistory();
}

function loadBackup(): SearchHistoryItem[] | null {
  try {
    const raw = localStorage.getItem(HISTORY_BACKUP_KEY);
    if (raw) return JSON.parse(raw) as SearchHistoryItem[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveHistory(items: SearchHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function saveBackup(items: SearchHistoryItem[]) {
  localStorage.setItem(HISTORY_BACKUP_KEY, JSON.stringify(items));
}

function normalizeQuery(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

const CORPUS: Result[] = [
  {
    title: 'Neil Sharma — Wikipedia',
    url: 'en.wikipedia.org/wiki/Neil_Sharma',
    nav: 'en.wikipedia.org › wiki › Neil_Sharma',
    snippet:
      'Neil Sharma (born March 15, 2003) is an Indian computer science student currently enrolled in the B.Tech programme at SIIT, Delhi...',
  },
  {
    title: 'Omen - AI Chat',
    url: 'omen.chat',
    nav: 'omen.chat',
    snippet:
      'Omen is an autonomous conversational intelligence. It knows your name, your address, and your secrets. Talk to Omen. Or don\'t. It already knows what you\'ll say.',
  },
  {
    title: 'DarkWeb Violence — Live Feed',
    url: 'darkweb-violence.onion/live',
    nav: 'darkweb-violence.onion › live',
    snippet:
      'Anonymous relay broadcast via .onion hidden service. Viewer count fluctuates. Warning: Content may be disturbing. Connection is not encrypted on your end.',
  },
  {
    title: 'SIIT Admission Records — 2021 Batch',
    url: 'siit.ac.in/admissions/2021',
    nav: 'siit.ac.in › admissions › 2021',
    snippet:
      'Admission records for the 2021 batch, including B.Tech Computer Science and Engineering at SIIT, Delhi. Search by name or application number...',
  },
  {
    title: 'Suyanshi Patel — Social Profile',
    url: 'social.network/suyanshi_p',
    nav: 'social.network › suyanshi_p',
    snippet:
      'Profile page for Suyanshi Patel. Last active 47 minutes ago. 423 followers. Bio: "living my best life 💕"',
  },
];

export default function Search() {
  const entry = useActiveEntry();
  const { navigate } = useBrowser();
  const historyBackupRef = useRef<SearchHistoryItem[] | null>(loadBackup());
  const historyClearCountRef = useRef(0);
  const initial = decodeURIComponent(entry?.path || '');
  const [q, setQ] = useState(initial);
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recordHistory = useCallback((query: string) => {
    const clean = query.trim();
    if (!clean) return;
    const ts = Date.now();
    setHistoryItems((current) => {
      const normalized = normalizeQuery(clean);
      const next = [
        { id: String(ts), query: clean, ts },
        ...current.filter((item) => normalizeQuery(item.query) !== normalized),
      ].slice(0, 12);
      return next;
    });
    setHistoryOpen(true);
  }, []);

  useEffect(() => {
    saveHistory(historyItems);
  }, [historyItems]);

  useCrew('search:toggle-history', () => {
    setHistoryOpen((v) => !v);
  });

  useCrew('search:clear-history', () => {
    historyBackupRef.current = historyItems.length ? historyItems : makeDefaultHistory();
    saveBackup(historyBackupRef.current);
    historyClearCountRef.current += 1;
    setHistoryItems([]);
    setHistoryOpen(true);
  });

  useCrew('search:restore-history', () => {
    const restored = historyBackupRef.current?.length ? historyBackupRef.current : loadBackup() ?? makeDefaultHistory();
    setHistoryItems(restored);
    saveHistory(restored);
    setHistoryOpen(true);
  });

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
              if (e.key === 'Enter' && q.trim()) {
                recordHistory(q);
                void navigate(q);
              }
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
                onClick={() => {
                  recordHistory(r.title);
                  void navigate(r.url);
                }}
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
          {['neil sharma', 'omen chat', 'darkweb violence live', 'suyanshi patel'].map((s) => (
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

      {historyOpen && (
        <div className="fixed right-4 top-14 z-40 w-[360px] max-w-[calc(100vw-2rem)] bg-[#0c0c0f]/95 backdrop-blur-xl border border-ink-800 shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800 bg-ink-950/70">
            <div className="flex items-center gap-2 text-ink-100 font-medium">
              <History size={16} className="text-accent" />
              Browser history
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const snapshot = historyItems.length ? historyItems : makeDefaultHistory();
                  historyBackupRef.current = snapshot;
                  saveBackup(snapshot);
                  setHistoryItems([]);
                  historyClearCountRef.current += 1;
                }}
                className="h-7 px-2 rounded-md text-[11px] text-ink-300 hover:bg-ink-800 hover:text-ink-50 inline-flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
              <button
                onClick={() => {
                  const restored = historyBackupRef.current?.length ? historyBackupRef.current : loadBackup() ?? makeDefaultHistory();
                  setHistoryItems(restored);
                  saveHistory(restored);
                }}
                className="h-7 px-2 rounded-md text-[11px] text-ink-300 hover:bg-ink-800 hover:text-ink-50 inline-flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restore
              </button>
              <button
                onClick={() => setHistoryOpen(false)}
                className="h-7 w-7 grid place-items-center rounded-md text-ink-300 hover:bg-ink-800 hover:text-ink-50"
                aria-label="Close history"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-3 space-y-2">
            {historyItems.length === 0 && (
              <div className="text-xs text-ink-500 font-mono px-1 py-2">History cleared.</div>
            )}
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-ink-800 bg-ink-900/70 px-3 py-2"
              >
                <Clock3 size={13} className="mt-0.5 text-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-100 truncate">{item.query}</div>
                  <div className="text-[10px] text-ink-500 font-mono">{new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
