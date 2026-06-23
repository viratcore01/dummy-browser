import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  History,
  Pencil,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useCrew } from '../browser/store';

interface Section {
  id: string;
  title: string;
  body: string[];
  open: boolean;
}

interface EditRecord {
  user: string;
  time: string;
  summary: string;
  bytes: number;
}

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

const INITIAL_HISTORY: EditRecord[] = [
  { user: 'atlas_scraper', time: '14:32:08', summary: 'Added football career details', bytes: 412 },
  { user: 'siit_alum', time: '14:28:51', summary: 'Added relationship status', bytes: 156 },
  { user: 'delhi_wiki', time: '14:15:33', summary: 'Created biographical article', bytes: 1240 },
  { user: 'anonymous', time: '14:10:02', summary: 'Added early life section', bytes: 890 },
  { user: 'corridor_archivist', time: '01:50:14', summary: 'Created redirect to old article', bytes: 120 },
];

// Horror payload: new paragraphs that appear live
const HORROR_PARAS: string[] = [
  'The confessions page was not anonymous. IP logs recovered by an independent researcher identify the administrator.',
  'A deleted tweet from 2024 shows Sharma acknowledging the page\'s impact on mental health.',
  'The engineering department has not commented on whether Sharma\'s behavior will affect his enrollment.',
  'Three former classmates have since confirmed that the confessions page operated for 18 months before deletion.',
];

const REFS = [
  { n: 1, text: 'Sigma Public School yearbook, 2023. Page 47.', url: 'archive.local/edu/sps' },
  { n: 2, text: 'SIIT Delhi student records, Department of Engineering.', url: 'archive.local/edu/siit' },
  { n: 3, text: 'SIIT Delhi football team roster, 2024 season.', url: 'archive.local/spt/siit-fc' },
  { n: 4, text: 'ATLAS conversational log, session 0047. Quoted under fair use.', url: 'atlas.chat' },
  { n: 5, text: 'Deleted social media archive, retrieved 2026.', url: 'archive.local/soc/neil' },
];

export default function Wiki() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [history] = useState<EditRecord[]>(INITIAL_HISTORY);
  const [tab, setTab] = useState<'article' | 'history'>('article');
  const [newPara, setNewPara] = useState<{ id: number; text: string } | null>(null);
  const [editCount, setEditCount] = useState(5);
  const [activeRef, setActiveRef] = useState<number | null>(null);

  // hidden live update on article load — appears after a delay
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const schedule = () => {
      const delay = 9000 + Math.random() * 6000;
      setTimeout(() => {
        if (cancelled) return;
        if (i < HORROR_PARAS.length) {
          setNewPara({ id: Date.now(), text: HORROR_PARAS[i] });
          setEditCount((c) => c + 1);
          i++;
          schedule();
        }
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
    };
  }, []);

  // crew control: 2 → add a horror paragraph immediately
  useCrew('wiki:add', () => {
    const i = Math.floor(Math.random() * HORROR_PARAS.length);
    setNewPara({ id: Date.now(), text: HORROR_PARAS[i] });
    setEditCount((c) => c + 1);
  });
  useCrew('wiki:open', () => {
    /* navigation handled elsewhere */
  });

  const toggle = (id: string) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, open: !sec.open } : sec)));

  const lastEdit = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCount]);

  return (
    <div className="min-h-full bg-ink-950 text-ink-100">
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
                tab === t
                  ? 'border-accent text-ink-50'
                  : 'border-transparent text-ink-400 hover:text-ink-200'
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
        <article className="max-w-4xl mx-auto px-6 py-8">
          {/* Title block */}
          <div className="grid md:grid-cols-[1fr_240px] gap-8">
            <div>
               <h1 className="font-serif text-4xl text-ink-50 mb-1">Neil Sharma</h1>
              <p className="text-sm text-ink-500 mb-5">
                From Veilpedia, the free encyclopedia
              </p>

              {/* Infobox */}
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
                        <p key={i}>
                          {p}
                          {/* Insert horror paragraph inside the incident section */}
                           {sec.id === 'later' && i === sec.body.length - 1 && newPara && (
                            <span
                              key={newPara.id}
                              className="block mt-3 text-ink-300 italic"
                              style={{ animation: 'revealText 1.4s ease-out' }}
                            >
                              <ShieldAlert size={13} className="inline mr-1.5 text-warn align-text-bottom" />
                              {newPara.text}
                            </span>
                          )}
                        </p>
                      ))}
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
                      <button onClick={() => setActiveRef(null)} className="text-ink-500 text-xs hover:text-ink-300">
                        close
                      </button>
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
                  {/* Placeholder avatar */}
                  <div className="h-16 w-16 rounded-full bg-ink-700 grid place-items-center text-xl font-serif text-ink-300">
                    NS
                  </div>
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

      <style>{`@keyframes revealText{from{opacity:0;transform:translateY(4px);filter:blur(2px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}`}</style>
    </div>
  );
}

function HistoryView({ history, count }: { history: EditRecord[]; count: number }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <History size={18} className="text-ink-400" />
        <h1 className="font-serif text-2xl text-ink-50">Revision history</h1>
      </div>
      <p className="text-sm text-ink-500 mb-6">
        "Neil Sharma" — {count} edits · viewing latest 5 of {count}
      </p>

      <div className="space-y-3">
        {history.map((e, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-ink-900 border border-ink-800 hover:border-ink-700"
          >
            <div className={`h-2 w-2 rounded-full mt-2 ${e.bytes > 0 ? 'bg-accent' : e.bytes < 0 ? 'bg-danger' : 'bg-ink-500'}`} />
            <div className="flex-1">
              <div className="text-sm text-ink-100">{e.summary}</div>
              <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                <span className="font-mono">{e.user}</span>
                <span>·</span>
                <span className="font-mono">{e.time}</span>
                <span>·</span>
                <span className={e.bytes >= 0 ? 'text-accent' : 'text-danger'}>
                  {e.bytes >= 0 ? '+' : ''}{e.bytes} bytes
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="px-2.5 py-1 text-xs rounded bg-ink-800 text-ink-300 hover:bg-ink-700">prev</button>
              <button className="px-2.5 py-1 text-xs rounded bg-ink-800 text-ink-300 hover:bg-ink-700">cur</button>
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
