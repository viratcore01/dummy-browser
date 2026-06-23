import { useEffect, useCallback, useState } from 'react';
import {
  BookOpen,
  History,
  Pencil,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Clock,
  ShieldAlert,
  Play,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useCrew } from '../browser/store';

interface Section {
  id: string;
  title: string;
  body: string[];
  open: boolean;
}

interface UpdateRecord {
  id: string;
  trigger: number;
  text: string;
  time: string;
  director: string;
}

const STORAGE_KEY = 'veil.wiki.neil.v2';

const INITIAL_SECTIONS: Section[] = [
  {
    id: 'early-life',
    title: 'Early Life and Education',
    open: true,
    body: [
      'Neil Sharma was born and raised in Delhi. He completed his schooling at Sigma Public School, where he became notorious for running an anonymous confessions page on social media. The page allegedly exposed private secrets of several students, which led to significant reputational damage and emotional distress for many of his peers. He is currently pursuing a bachelor\'s degree in engineering from SIIT, Delhi.',
    ],
  },
  {
    id: 'football',
    title: 'Football Career',
    open: true,
    body: [
      'Sharma plays as an attacker for his college football team. He was selected for the team in 2024 after competitive trials. His selection brought him recognition among his peers and faculty, though it also created tensions with some of his close friends who were not selected.',
    ],
  },
  {
    id: 'family',
    title: 'Family',
    open: false,
    body: [
      'Neil Sharma lives with his parents and elder brother in Green View Apartments, Delhi. His family has been supportive of his education and football aspirations, though recent events have reportedly put significant strain on their household relationships.',
    ],
  },
  {
    id: 'personal',
    title: 'Personal Life',
    open: false,
    body: [
      'Sharma was in a relationship with Suyanshi, a fellow student at SIIT. Their relationship was often visible in college social circles. However, it reportedly ended due to personal issues.',
    ],
  },
  {
    id: 'later',
    title: 'Later Life',
    open: false,
    body: [
      'His girlfriend broke up with him after discovering that he was cheating on her with her best friend. This public breakup significantly affected his social standing and mental state according to various online accounts and updates.',
    ],
  },
];

const REFS = [
  { n: 1, text: 'Sigma Public School yearbook, 2023. Page 47.', url: 'archive.local/edu/sps' },
  { n: 2, text: 'SIIT Delhi student records, Department of Engineering.', url: 'archive.local/edu/siit' },
  { n: 3, text: 'SIIT Delhi football team roster, 2024 season.', url: 'archive.local/spt/siit-fc' },
  { n: 4, text: 'ATLAS conversational log, session 0047. Quoted under fair use.', url: 'atlas.chat' },
  { n: 5, text: 'Deleted social media archive, retrieved 2026.', url: 'archive.local/soc/neil' },
];

const INITIAL_HISTORY: UpdateRecord[] = [
  { id: '1', trigger: 0, text: 'Created biographical article', time: '14:15:33', director: 'delhi_wiki' },
  { id: '2', trigger: 0, text: 'Added early life section', time: '14:10:02', director: 'anonymous' },
];

function loadState(): {
  sections: Section[];
  history: UpdateRecord[];
  triggerStage: number;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveState(sections: Section[], history: UpdateRecord[], triggerStage: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections, history, triggerStage }));
  } catch {
    /* ignore */
  }
}

export default function Wiki() {
  const loaded = loadState();
  const [sections, setSections] = useState<Section[]>(loaded?.sections ?? INITIAL_SECTIONS);
  const [history, setHistory] = useState<UpdateRecord[]>(loaded?.history ?? INITIAL_HISTORY);
  const [triggerStage, setTriggerStage] = useState(loaded?.triggerStage ?? 0);
  const [tab, setTab] = useState<'article' | 'history'>('article');
  const [editCount, setEditCount] = useState(5);
  const [activeRef, setActiveRef] = useState<number | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    saveState(sections, history, triggerStage);
  }, [sections, history, triggerStage]);

  const lastEdit = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  const addUpdate = useCallback((trigger: number, text: string, sectionId?: string, addToSection: boolean = true) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const record: UpdateRecord = {
      id: String(Date.now()),
      trigger,
      text,
      time,
      director: 'director',
    };
    setHistory((h) => [...h, record]);
    setEditCount((c) => c + 1);

    if (addToSection && sectionId) {
      setSections((secs) =>
        secs.map((sec) => {
          if (sec.id === sectionId) {
            return {
              ...sec,
              body: [...sec.body, text],
              open: true,
            };
          }
          return sec;
        })
      );
    }

    if (trigger > 0) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, []);

  const fireTrigger = useCallback((num: number) => {
    if (num <= triggerStage) return;
    switch (num) {
      case 1:
        addUpdate(1, 'His girlfriend broke up with him after discovering that he cheated on her with her best friend.', 'later');
        break;
      case 2:
        addUpdate(2, 'Reports later connected him to steroid abuse during his football career.', 'football');
        break;
      case 3:
        addUpdate(3, "Neil's parents died due to drug overdose.", 'family');
        break;
      case 4:
        addUpdate(4, 'His girlfriend was found dead in the woods.', 'personal');
        break;
      case 5:
        addUpdate(5, 'Neil died friendless and alone.', 'later');
        break;
      case 6:
        addUpdate(6, '', 'later', false);
        setInfiniteLoading(true);
        break;
    }
    setTriggerStage(num);
  }, [triggerStage, addUpdate]);

  const nextTrigger = () => {
    const next = triggerStage + 1;
    if (next <= 6) fireTrigger(next);
  };

  const resetTriggers = () => {
    setTriggerStage(0);
    setSections(INITIAL_SECTIONS);
    setHistory(INITIAL_HISTORY);
    setInfiniteLoading(false);
    setIsRefreshing(false);
    setEditCount(5);
  };

  const handleUserEdit = (sectionId: string, newBody: string[]) => {
    setSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, body: newBody } : s)));
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const record: UpdateRecord = {
      id: String(Date.now()),
      trigger: 0,
      text: `Edited ${sectionId} section`,
      time,
      director: 'neil',
    };
    setHistory((h) => [...h, record]);
    setEditCount((c) => c + 1);
    setEditingSection(null);

    if (triggerStage === 0) {
      setTimeout(() => fireTrigger(1), 600);
    } else if (triggerStage === 1) {
      setTimeout(() => fireTrigger(2), 600);
    } else if (triggerStage === 4) {
      setTimeout(() => fireTrigger(5), 600);
    } else if (triggerStage === 5) {
      setTimeout(() => fireTrigger(6), 600);
    }
  };

  const startEdit = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (sec) {
      setEditingSection(sectionId);
      setEditDraft(sec.body.join('\n\n'));
    }
  };

  const saveEdit = () => {
    if (!editingSection) return;
    const newBody = editDraft.split('\n\n').filter((p) => p.trim());
    handleUserEdit(editingSection, newBody);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`') {
        e.preventDefault();
        setShowControlPanel((p) => !p);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        const next = triggerStage + 1;
        if (next <= 6) fireTrigger(next);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        setShowControlPanel(true);
      }
      if (e.key === 'Escape') {
        setShowControlPanel(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerStage, fireTrigger]);

  useCrew('wiki:trigger', (p) => {
    const t = (p as number) || 1;
    fireTrigger(t);
  });

  const toggle = (id: string) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, open: !sec.open } : sec)));

  return (
    <div className={`min-h-full bg-ink-950 text-ink-100 ${isRefreshing ? 'transition-opacity duration-300' : ''}`}>
      <style>{`@keyframes revealText{from{opacity:0;transform:translateY(4px);filter:blur(2px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}`}</style>

      {showControlPanel && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ink-900 border border-ink-700 rounded-xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-accent" />
                <h2 className="text-sm font-mono text-ink-200 uppercase tracking-wider">Director Control Panel</h2>
              </div>
              <button onClick={() => setShowControlPanel(false)} className="text-ink-500 hover:text-ink-200 text-xs">ESC</button>
            </div>
            <div className="text-[11px] text-ink-500 mb-4 font-mono">Trigger Stage: {triggerStage} / 6</div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => fireTrigger(n)}
                  disabled={n <= triggerStage}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between ${
                    n <= triggerStage ? 'bg-ink-800 text-ink-500 cursor-not-allowed' : 'bg-ink-850 text-ink-200 hover:bg-ink-800 hover:text-ink-50'
                  }`}
                >
                  <span>Trigger {n}</span>
                  {n <= triggerStage && <span className="text-[10px] text-ink-600">done</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-ink-800 flex gap-2">
              <button onClick={nextTrigger} className="flex-1 px-3 py-2 rounded-lg bg-accent text-ink-950 text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-1.5">
                <Play size={13} /> Next (F2)
              </button>
              <button onClick={resetTriggers} className="px-3 py-2 rounded-lg bg-ink-800 text-ink-300 text-sm hover:bg-ink-700 inline-flex items-center gap-1.5">
                <RotateCcw size={13} /> Reset
              </button>
            </div>
            <div className="mt-3 text-[10px] text-ink-600 text-center font-mono">
              ~ toggle · F2 next · Ctrl+Shift+W open
            </div>
          </div>
        </div>
      )}

      {/* Site header */}
      <div className="border-b border-ink-800 bg-ink-900">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen size={20} className="text-accent" />
              <span className="font-serif text-lg tracking-wide">Veilpedia</span>
              <span className="text-[10px] text-ink-500 font-mono ml-2 px-2 py-0.5 rounded bg-ink-800">free knowledge</span>
            </div>
            <div className="text-[11px] text-ink-500 font-mono">the encyclopedia anyone can edit</div>
          </div>
        </div>
      </div>

      {/* Article tabs */}
      <div className="border-b border-ink-800 bg-ink-900">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-1">
          {(['article', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm border-b-2 -mb-px capitalize transition-colors ${
                tab === t ? 'border-accent text-ink-50' : 'border-transparent text-ink-400 hover:text-ink-200'
              }`}
            >
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <button className="ml-3 px-3 py-1.5 my-2 rounded-md text-xs text-accent hover:bg-ink-800 inline-flex items-center gap-1.5">
            <Pencil size={12} /> Edit source
          </button>
        </div>
      </div>

      {tab === 'article' ? (
        <article className={`max-w-4xl mx-auto px-6 py-8 ${isRefreshing ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}>
          <div className="grid md:grid-cols-[1fr_240px] gap-8">
            <div>
              <h1 className="font-serif text-4xl text-ink-50 mb-1">Neil Sharma</h1>
              <p className="text-sm text-ink-500 mb-5">From Veilpedia, the free encyclopedia</p>

              <div className="hidden md:block mb-6" />

              {sections.map((sec) => (
                <section key={sec.id} className="mb-1">
                  <button
                    onClick={() => toggle(sec.id)}
                    className="w-full flex items-center gap-2 py-2 -mx-1 px-1 group"
                  >
                    {sec.open ? <ChevronDown size={16} className="text-ink-500" /> : <ChevronRight size={16} className="text-ink-500" />}
                    <h2 className="font-serif text-2xl text-ink-50 border-b border-ink-800 flex-1 pb-1">
                      {sec.title}
                    </h2>
                  </button>
                  {sec.open && (
                    <div className="pl-6 py-2 space-y-3 text-[15px] leading-7 text-ink-200">
                      {sec.body.map((p, i) => (
                        <p key={i} className={p.startsWith('UPDATE:') || p.startsWith('Neil died') ? 'text-warn italic' : ''}>
                          {p}
                          {sec.id === 'later' && i === sec.body.length - 1 && infiniteLoading && (
                            <span className="block mt-3 text-ink-400 italic">
                              <ShieldAlert size={13} className="inline mr-1.5 text-warn align-text-bottom" />
                              Neil died friendless and alone.
                              <br />
                              Date and Time:{' '}
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1 align-middle" />
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" style={{ animationDelay: '0.2s' }} />
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" style={{ animationDelay: '0.4s' }} />
                              <br />
                              Cause of Death:{' '}
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1 align-middle" style={{ animationDelay: '0.1s' }} />
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" style={{ animationDelay: '0.3s' }} />
                              <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" style={{ animationDelay: '0.5s' }} />
                            </span>
                          )}
                        </p>
                      ))}
                      {editingSection === sec.id ? (
                        <div className="mt-2 p-3 bg-ink-900 border border-ink-700 rounded-lg">
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="w-full bg-transparent outline-none resize-none text-[15px] leading-7 text-ink-100 min-h-[100px]"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={saveEdit} className="px-3 py-1 rounded bg-accent text-ink-950 text-xs font-medium hover:opacity-90">Save</button>
                            <button onClick={() => setEditingSection(null)} className="px-3 py-1 rounded bg-ink-800 text-ink-300 text-xs hover:bg-ink-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(sec.id)}
                          className="mt-2 text-[11px] text-ink-600 hover:text-accent font-mono"
                        >
                          [edit section]
                        </button>
                      )}
                    </div>
                  )}
                </section>
              ))}

              {/* References */}
              <section className="mt-8">
                <h2 className="font-serif text-xl text-ink-50 border-b border-ink-800 pb-1 mb-3">References</h2>
                <ol className="space-y-1.5 text-sm text-ink-300">
                  {REFS.map((r) => (
                    <li key={r.n} className="flex gap-2">
                      <button
                        onClick={() => setActiveRef(r.n)}
                        className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-ink-800 text-[11px] text-accent hover:bg-ink-700"
                      >
                        {r.n}
                      </button>
                      <span className="text-ink-400">
                        {r.text}{' '}
                        <span className="font-mono text-ink-500">{r.url}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                {activeRef && (
                  <div className="mt-4 p-4 bg-ink-900 border border-ink-800 rounded-lg text-sm text-ink-300">
                    <div className="text-[11px] text-ink-500 mb-1 font-mono">Reference [{activeRef}]</div>
                    {REFS.find((r) => r.n === activeRef)?.text}
                    <div className="mt-2 flex gap-2">
                      <button className="text-accent text-xs inline-flex items-center gap-1 hover:underline">
                        <ExternalLink size={11} /> Open source
                      </button>
                      <button onClick={() => setActiveRef(null)} className="text-ink-500 text-xs hover:text-ink-300">close</button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar infobox */}
            <aside>
              <div className="border border-ink-800 rounded-lg overflow-hidden bg-ink-900 text-sm">
                <div className="bg-ink-850 px-3 py-2 text-center font-serif text-base text-ink-50 border-b border-ink-800">
                  Neil Sharma
                </div>
                <div className="aspect-square bg-ink-950 grid place-items-center relative overflow-hidden">
                  <div className="h-16 w-16 rounded-full bg-ink-700 grid place-items-center text-xl font-serif text-ink-300">NS</div>
                  <div className="absolute bottom-0 left-0 right-0 bg-ink-950/80 backdrop-blur px-2 py-1 text-[10px] text-center text-ink-400">
                    Student · Athlete
                  </div>
                </div>
                <dl className="px-3 py-3 space-y-2 text-[13px]">
                  {[
                    ['Born', '2005'],
                    ['Status', 'Student'],
                    ['Known for', 'Confessions page, Football'],
                    ['Location', 'Delhi, India'],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[80px_1fr] gap-2">
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="text-ink-200">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border-t border-ink-800 px-3 py-2 flex items-center gap-1 text-[11px] text-ink-500">
                  <Clock size={11} /> last edited {lastEdit} · {editCount} edits
                </div>
              </div>
              <div className="mt-3 text-[11px] text-ink-600 px-1">
                This article has been edited {editCount} times in the last hour.
              </div>
            </aside>
          </div>
        </article>
      ) : (
        <HistoryView history={history} count={editCount} />
      )}
    </div>
  );
}

function HistoryView({ history, count }: { history: UpdateRecord[]; count: number }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <History size={18} className="text-ink-400" />
        <h1 className="font-serif text-2xl text-ink-50">Revision history</h1>
      </div>
      <p className="text-sm text-ink-500 mb-6">
        "Neil Sharma" — {count} edits · viewing latest {Math.min(history.length, 10)} of {history.length}
      </p>

      <div className="space-y-3">
        {history.slice().reverse().slice(0, 10).map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-ink-900 border border-ink-800 hover:border-ink-700"
          >
            <div className={`h-2 w-2 rounded-full mt-2 ${e.trigger > 0 ? 'bg-danger' : 'bg-accent'}`} />
            <div className="flex-1">
              <div className="text-sm text-ink-100">{e.text}</div>
              <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                <span className="font-mono">{e.director}</span>
                <span>·</span>
                <span className="font-mono">{e.time}</span>
                {e.trigger > 0 && <span className="text-danger text-[10px]">TRIGGER {e.trigger}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-ink-900/50 border border-ink-800 text-xs text-ink-500">
        Anonymous editors are identified by IP hash. Some entries in this log were modified after the fact.
      </div>
    </div>
  );
}
