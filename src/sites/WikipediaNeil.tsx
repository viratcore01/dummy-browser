import { useMemo, useState, useCallback, useRef } from 'react';
import {
  BookOpen, History, ChevronRight, ChevronDown,
  Clock, AlertTriangle, ExternalLink, Save, X
} from 'lucide-react';
import { useCrew } from '../browser/store';
import scriptData from '../data/script.json';
import { useScript } from '../browser/ScriptEngine';

interface Section {
  id: string;
  title: string;
  body: string[];
  visible: boolean;
}

interface ForcedUpdate {
  id: string;
  section_title: string;
  text: string;
  edit_summary: string;
  editor: string;
  loading?: boolean;
}

interface EditRecord {
  user: string;
  time: string;
  summary: string;
  bytes: number;
}

const INITIAL_SECTIONS: Section[] = scriptData.wikipedia.initial_sections as unknown as Section[];

const INFOBOX_DATA = [
  ['Born', 'March 15, 2003'],
  ['Nationality', 'Indian'],
  ['Education', 'SIIT, Delhi'],
  ['Known for', '—'],
  ['Status', 'Active'],
];

const INITIAL_HISTORY: EditRecord[] = [
  { user: 'wiki_admin', time: '12:00:00', summary: 'Created article — Neil Sharma', bytes: 2840 },
  { user: 'bot_23', time: '12:05:14', summary: 'Added categories and infobox', bytes: 412 },
  { user: 'anonymous_178.xx', time: '12:11:33', summary: 'Minor corrections to personal life', bytes: 88 },
];

const REFS = [
  { n: 1, text: 'SIIT Admission Records, 2021 batch. Verified.', url: 'siit.ac.in/admissions' },
  { n: 2, text: 'CBSE Results Portal, 2021.', url: 'cbse.gov.in/results' },
  { n: 3, text: 'Anonymous source, undisclosed location. Unverified.', url: '[citation needed]' },
  { n: 4, text: 'Hospital records, City Hospital. Restricted access.', url: '[restricted]' },
  { n: 5, text: 'Police report #2025/BRK/1847. Under review.', url: '[sealed]' },
];

export default function WikipediaNeil() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [forcedUpdates, setForcedUpdates] = useState<ForcedUpdate[]>([]);
  const [editHistory, setEditHistory] = useState<EditRecord[]>(INITIAL_HISTORY);
  const [tab, setTab] = useState<'article' | 'history'>('article');
  const [editCount, setEditCount] = useState(3);
  const [activeRef, setActiveRef] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [flashSection, setFlashSection] = useState<string | null>(null);
  const [infoboxStatus, setInfoboxStatus] = useState('Active');
  const [infoboxKnownFor, setInfoboxKnownFor] = useState('—');
  const [showOverrideOne, setShowOverrideOne] = useState(false);
  const [showOverrideTwo, setShowOverrideTwo] = useState(false);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const originalTextRef = useRef<string>('');
  const triggeredRef = useRef<Set<string>>(new Set());
  const [loadingOverlay, setLoadingOverlay] = useState(false);

  const script = useScript();

  // Director: F2 → force Wikipedia update
  useCrew('wiki:force-update', (payload) => {
    const update = payload as ForcedUpdate;
    if (!update || triggeredRef.current.has(update.id)) return;

    triggeredRef.current = new Set(triggeredRef.current).add(update.id);
    applyForcedUpdate(update);
  });

  useCrew('wiki:demo-edit', (payload) => {
    const p = payload as { sectionId?: string; removeLines?: string[] } | null;
    if (!p?.sectionId) return;

    const section = sections.find((s) => s.id === p.sectionId);
    if (!section) return;

    let body = section.body.join('\n');
    for (const token of p.removeLines ?? []) {
      const regex = new RegExp('^.*' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*$', 'im');
      body = body.replace(regex, '').trim();
    }
    const newBody = body.split('\n').filter((line) => line.trim() !== '');

    setSections((s) => s.map((sec) => (sec.id === p.sectionId ? { ...sec, body: newBody.length ? newBody : [''] } : sec)));
    setEditHistory((prev) => [
      {
        user: 'demo',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        summary: 'Demo: automatic edit',
        bytes: newBody.join(' ').length - section.body.join(' ').length,
      },
      ...prev,
    ]);
    setEditCount((c) => c + 1);

    const removed = section.body.join('\n').split('\n').filter((line) => !newBody.includes(line)).join('\n');
    if (removed.trim().length > 0) {
      tryTriggerNextUpdate(removed);
    }
  });

  useCrew('wiki:demo-type', (payload) => {
    const p = payload as { text?: string } | null;
    const text = p?.text?.trim();
    if (!text) return;

    if (text.toLowerCase().includes('at last everything got better and no one died.')) {
      setShowOverrideOne(true);
      setForcedUpdates((prev) => prev.filter((u) => u.id !== 'update-final-death' && u.id !== 'update-final-loading'));
      setSections((s) => s.map((sec) => (sec.id === 'overview' || sec.id === 'personal-life' ? { ...sec, body: ['Neil died friendless and alone.'] } : sec)));
      setEditHistory((prev) => [
        {
          user: 'OMEN',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          summary: 'Override: Neil died friendless and alone.',
          bytes: 35,
        },
        ...prev,
      ]);
      setEditCount((c) => c + 1);
      let next = script.getNextWikiUpdate();
      while (next && (next.id === 'update-final-death' || next.id === 'update-final-loading')) {
        triggeredRef.current = new Set(triggeredRef.current).add(next.id);
        script.advanceWiki();
        next = script.getNextWikiUpdate();
      }
      return;
    }

    if (text.toLowerCase().includes('neil lived happily ever after.')) {
      setShowOverrideTwo(true);
      setInfoboxStatus('LOADING...');
      setLoadingOverlay(true);
      setForcedUpdates((prev) => prev.filter((u) => u.id !== 'update-final-death' && u.id !== 'update-final-loading'));
      setSections((s) => s.map((sec) => (sec.id === 'overview' || sec.id === 'personal-life' ? { ...sec, body: ['Neil died friendless and alone.'] } : sec)));
      setEditHistory((prev) => [
        {
          user: 'OMEN',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          summary: 'Override: Neil never loved himself ever again.',
          bytes: 40,
        },
        ...prev,
      ]);
      setEditCount((c) => c + 1);
      let next = script.getNextWikiUpdate();
      while (next && (next.id === 'update-final-death' || next.id === 'update-final-loading')) {
        triggeredRef.current = new Set(triggeredRef.current).add(next.id);
        script.advanceWiki();
        next = script.getNextWikiUpdate();
      }
      return;
    }
  });

  const applyForcedUpdate = (update: ForcedUpdate) => {
    setForcedUpdates(prev => [...prev, update]);
    setEditCount(c => c + 1);
    setEditHistory(prev => [{
      user: update.editor,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      summary: update.edit_summary,
      bytes: update.text.length,
    }, ...prev]);
    setFlashSection(update.section_title);
    setTimeout(() => setFlashSection(null), 3000);

    if (update.id === 'update-cheating') {
      setInfoboxKnownFor('Cheating Controversy');
    }
    if (update.id === 'update-parents' || update.id === 'update-girlfriend-dead') {
      setInfoboxKnownFor('Incident subject');
    }
    if (update.id === 'update-final-death') {
      setInfoboxStatus('Deceased');
      setInfoboxKnownFor('Deceased');
    }
    if (update.loading) {
      setLoadingOverlay(true);
      if (update.id === 'update-final-loading') {
        setTimeout(() => setLoadingOverlay(false), 1800);
      }
    }
  };

  const tryTriggerNextUpdate = (removedText: string) => {
    const lowerRemoved = removedText.toLowerCase();
    const next = script.getNextWikiUpdate();
    if (!next) return;
    if (triggeredRef.current.has(next.id)) return;

    let shouldTrigger = false;
    if (next.id === 'update-cheating' && (lowerRemoved.includes('cheat') || lowerRemoved.includes('best friend') || lowerRemoved.includes('infidelity'))) {
      shouldTrigger = true;
    } else if (next.id === 'update-steroids' && (lowerRemoved.includes('broke up') || lowerRemoved.includes('breakup') || lowerRemoved.includes('girlfriend broke'))) {
      shouldTrigger = true;
    } else if (next.id === 'update-parents' && (lowerRemoved.includes('parents') || lowerRemoved.includes('family'))) {
      shouldTrigger = true;
    } else if (next.id === 'update-girlfriend-dead' && (lowerRemoved.includes('girlfriend') || lowerRemoved.includes('found dead'))) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      script.advanceWiki();
      applyForcedUpdate(next as ForcedUpdate);
    }
  };

  const startEdit = (section: Section, forcedBodies: string[] = []) => {
    const renderedBody = [...section.body, ...forcedBodies];
    originalTextRef.current = renderedBody.join('\n');
    setEditDraft(renderedBody.join('\n'));
    setEditingSectionId(section.id);
  };

  const cancelEdit = () => {
    setEditingSectionId(null);
    setEditDraft('');
    originalTextRef.current = '';
  };

  const saveEdit = () => {
    if (!editingSectionId) return;

    const currentSection = sections.find(sec => sec.id === editingSectionId);
    const currentForcedBodies = currentSection ? (updatesBySection[currentSection.title] || []).map(u => u.text) : [];
    const original = originalTextRef.current;
    const updated = editDraft;
    const newBody = editDraft.split('\n').filter((line) => line.trim() !== '');
    const stripForcedBodies = (body: string[]) => body.filter((line) => !currentForcedBodies.some(forced => forced.trim().toLowerCase() === line.trim().toLowerCase()));

    const removedParts = original.split('\n').filter((line) => !updated.includes(line));
    const removedText = removedParts.join('\n');

    if (removedText.trim().length > 0) {
      tryTriggerNextUpdate(removedText);
    }

    if (removedText.toLowerCase().includes('neil died friendless and alone.')) {
      setShowOverrideTwo(true);
      setForcedUpdates(prev => prev.filter(u => u.id !== 'update-final-death' && u.id !== 'update-final-loading'));
      setInfoboxStatus('LOADING...');
      setSections(s => s.map(sec => sec.id === editingSectionId ? { ...sec, body: stripForcedBodies(newBody).length ? stripForcedBodies(newBody) : [''] } : sec));
      setEditHistory(prev => [{
        user: 'OMEN',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        summary: 'Override: Neil died friendless and alone.',
        bytes: stripForcedBodies(newBody).join(' ').length,
      }, ...prev]);
      setEditCount(c => c + 1);
      setLoadingOverlay(true);
      setEditingSectionId(null);
      setEditDraft('');
      setTimeout(() => setLoadingOverlay(false), 1800);
      return;
    }

    if (updated.toLowerCase().includes('at last everything got better and no one died.')) {
      setShowOverrideOne(true);
      setForcedUpdates(prev => prev.filter(u => u.id !== 'update-final-death' && u.id !== 'update-final-loading'));
      setSections(s => s.map(sec => sec.id === editingSectionId ? { ...sec, body: stripForcedBodies(newBody).length ? stripForcedBodies(newBody) : [''] } : sec));
      setEditHistory(prev => [{
        user: 'OMEN',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        summary: 'Override: Neil died friendless and alone.',
        bytes: 35,
      }, ...prev]);
      setEditCount(c => c + 1);
      let next = script.getNextWikiUpdate();
      while (next && (next.id === 'update-final-death' || next.id === 'update-final-loading')) {
        triggeredRef.current = new Set(triggeredRef.current).add(next.id);
        script.advanceWiki();
        next = script.getNextWikiUpdate();
      }
      setEditingSectionId(null);
      setEditDraft('');
      return;
    }

    if (updated.toLowerCase().includes('neil lived happily ever after.')) {
      setShowOverrideTwo(true);
      setForcedUpdates(prev => prev.filter(u => u.id !== 'update-final-death' && u.id !== 'update-final-loading'));
      setInfoboxStatus('LOADING...');
      setSections(s => s.map(sec => sec.id === editingSectionId ? { ...sec, body: stripForcedBodies(newBody).length ? stripForcedBodies(newBody) : [''] } : sec));
      setEditHistory(prev => [{
        user: 'OMEN',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        summary: 'Override: Neil never loved himself ever again.',
        bytes: 40,
      }, ...prev]);
      setEditCount(c => c + 1);
      setLoadingOverlay(true);
      let next = script.getNextWikiUpdate();
      while (next && (next.id === 'update-final-death' || next.id === 'update-final-loading')) {
        triggeredRef.current = new Set(triggeredRef.current).add(next.id);
        script.advanceWiki();
        next = script.getNextWikiUpdate();
      }
      setEditingSectionId(null);
      setEditDraft('');
      return;
    }

    setSections(s => s.map(sec => sec.id === editingSectionId ? { ...sec, body: newBody.length ? newBody : [''] } : sec));
    setEditHistory(prev => [{
      user: 'you',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      summary: 'Edited section',
      bytes: newBody.join(' ').length - original.length,
    }, ...prev]);
    setEditCount(c => c + 1);
    setEditingSectionId(null);
    setEditDraft('');
  };

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const lastEdit = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [editCount]);

  // Group forced updates by section
  const updatesBySection = useMemo(() => {
    const map: Record<string, ForcedUpdate[]> = {};
    for (const u of forcedUpdates) {
      if (!map[u.section_title]) map[u.section_title] = [];
      map[u.section_title].push(u);
    }
    return map;
  }, [forcedUpdates]);

  // Get all unique section titles including forced ones
  const allSectionTitles = useMemo(() => {
    const existing = new Set(sections.map(s => s.title));
    const forced = new Set(forcedUpdates.map(u => u.section_title));
    const newSections = [...forced].filter(t => !existing.has(t));
    return newSections;
  }, [sections, forcedUpdates]);


   return (
     <div className="min-h-full bg-white text-gray-900">
       {loadingOverlay && (
        <div className="fixed top-4 right-4 z-[300] bg-black border border-gray-700 rounded-lg p-3 shadow-2xl max-w-xs">
          <div className="text-center space-y-2">
            <div className="text-gray-700 text-[10px] font-mono opacity-40 animate-pulse">signal lost</div>
            <div className="text-gray-700 text-[10px] font-mono opacity-30">Date and Time: LOADING...</div>
            <div className="text-gray-700 text-[10px] font-mono opacity-30">Cause of Death: LOADING...</div>
          </div>
        </div>
      )}
      {/* Wikipedia header */}
      <div className="border-b border-gray-200 bg-[#f8f9fa]">
        <div className="max-w-[1100px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen size={22} className="text-gray-600" />
              <span className="text-xl font-serif text-gray-800">Wikipedia</span>
              <span className="text-[10px] text-gray-400 font-sans ml-1">The Free Encyclopedia</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>English</span>
              <span>·</span>
              <span>{editCount} edits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 flex items-center gap-0">
          {(['article', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm border-b-2 -mb-px capitalize transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t === 'history' && <History size={13} className="inline mr-1.5 -mt-0.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'article' ? (
        <article className="max-w-[1100px] mx-auto px-6 py-6">
          <div className="grid md:grid-cols-[1fr_280px] gap-8">
            <div>
              {/* Article title */}
              <h1 className="text-3xl font-serif text-gray-900 mb-1 border-b border-gray-200 pb-2">
                {scriptData.wikipedia.subject_name}
              </h1>
              <p className="text-sm text-gray-500 mb-5 italic">
                From Wikipedia, the free encyclopedia
              </p>

              {/* Dispute banner if there are forced updates */}
              {(forcedUpdates.length > 0 || showOverrideOne || showOverrideTwo) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2 text-sm text-yellow-800"
                  style={{ animation: 'wikiReveal 0.5s ease-out' }}
                >
                  <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>This article has multiple issues.</strong> It has been rapidly edited by anonymous sources. 
                    Content may not reflect verified information. <span className="text-yellow-600 text-xs">[{editCount} edits in session]</span>
                  </div>
                </div>
              )}

              {/* Initial sections */}
              {sections.filter(s => s.visible).map(sec => {
                const isCollapsed = collapsedSections.has(sec.id);
                const sectionUpdates = updatesBySection[sec.title] || [];
                const isFlashing = flashSection === sec.title;
                return (
                  <section key={sec.id} className="mb-4">
                    <button
                      onClick={() => toggleSection(sec.id)}
                      className="w-full flex items-center gap-1.5 py-1.5 group text-left"
                    >
                      {isCollapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      <h2 className="text-xl font-serif text-gray-900 border-b border-gray-200 flex-1 pb-0.5">
                        {sec.title}
                      </h2>
                    </button>
                     {!isCollapsed && (
                       <div className="pl-5 py-2 text-[15px] leading-7 text-gray-700 group">
                          {sec.body.map((p, i) => (
                            <p key={i} className="relative">
                              {p}
                            </p>
                          ))}
                          {!editingSectionId && (
                            <button
                              onClick={() => startEdit(sec, sectionUpdates.map(u => u.text))}
                              className="mt-2 text-xs text-gray-400 hover:text-blue-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              [edit section]
                            </button>
                          )}
                        
                        {/* Forced updates for this section */}
                        {sectionUpdates.map(u => (
                          <p
                            key={u.id}
                            className={`mt-3 ${isFlashing && u === sectionUpdates[sectionUpdates.length - 1] ? 'bg-yellow-100 -mx-2 px-2 py-1 rounded border-l-4 border-yellow-400' : ''}`}
                            style={{ animation: 'wikiReveal 1s ease-out' }}
                          >
                            {u.text}
                            <sup className="text-blue-600 text-xs ml-0.5 cursor-pointer hover:underline">[{REFS.length}]</sup>
                          </p>
                         ))}

                        </div>
                      )}
                    </section>
                );
              })}

              {/* New sections from forced updates (sections that don't match existing ones) */}
              {allSectionTitles.map(title => {
                const updates = updatesBySection[title] || [];
                if (updates.length === 0) return null;
                const isCollapsed = collapsedSections.has(title);
                const isFlashing = flashSection === title;
                return (
                  <section key={title} className="mb-4" style={{ animation: 'wikiReveal 1s ease-out' }}>
                    <button
                      onClick={() => toggleSection(title)}
                      className="w-full flex items-center gap-1.5 py-1.5 group text-left"
                    >
                      {isCollapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      <h2 className="text-xl font-serif text-gray-900 border-b border-gray-200 flex-1 pb-0.5">
                        {title}
                        {isFlashing && (
                          <span className="ml-2 text-xs text-yellow-600 font-sans animate-pulse">[just updated]</span>
                        )}
                      </h2>
                    </button>
                    {!isCollapsed && (
                      <div className="pl-5 py-2 text-[15px] leading-7 text-gray-700">
                        {updates.map((u, i) => (
                          <p
                            key={u.id}
                            className={`${i > 0 ? 'mt-3' : ''} ${isFlashing && u === updates[updates.length - 1] ? 'bg-yellow-100 -mx-2 px-2 py-1 rounded border-l-4 border-yellow-400' : ''}`}
                            style={{ animation: 'wikiReveal 1s ease-out' }}
                          >
                            {u.text}
                            <sup className="text-blue-600 text-xs ml-0.5 cursor-pointer hover:underline">[{i + REFS.length + 1}]</sup>
                          </p>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {/* References */}
              <section className="mt-8">
                <h2 className="text-xl font-serif text-gray-900 border-b border-gray-200 pb-1 mb-3">References</h2>
                <ol className="space-y-1.5 text-sm text-gray-600">
                  {REFS.map(r => (
                    <li key={r.n} className="flex gap-2">
                      <button
                        onClick={() => setActiveRef(r.n)}
                        className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-blue-50 text-[11px] text-blue-600 hover:bg-blue-100"
                      >
                        {r.n}
                      </button>
                      <span className="text-gray-500">
                        {r.text}{' '}
                        <span className="text-blue-500 text-xs">{r.url}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                {activeRef && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    <div className="text-[11px] text-gray-400 mb-1">Reference [{activeRef}]</div>
                    {REFS.find(r => r.n === activeRef)?.text}
                    <div className="mt-2 flex gap-2">
                      <button className="text-blue-600 text-xs inline-flex items-center gap-1 hover:underline">
                        <ExternalLink size={11} /> View source
                      </button>
                      <button onClick={() => setActiveRef(null)} className="text-gray-400 text-xs hover:text-gray-600">
                        close
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Categories */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <span className="font-medium text-gray-600">Categories:</span>{' '}
                <span className="text-blue-600">2003 births</span> · <span className="text-blue-600">Living people</span> · <span className="text-blue-600">SIIT alumni</span> · <span className="text-blue-600">People from Lucknow</span>
                {forcedUpdates.some(u => u.id === 'update-died-friendless') && (
                  <span> · <span className="text-blue-600">2025 deaths</span></span>
                )}
              </div>
            </div>

            {/* Sidebar infobox */}
            <aside>
              <div className="border border-gray-200 rounded overflow-hidden bg-[#f8f9fa]">
                <div className="bg-[#eaecf0] px-3 py-2 text-center font-serif text-base text-gray-800 border-b border-gray-200">
                  {scriptData.wikipedia.subject_name}
                </div>
                {/* Photo placeholder */}
                <div className="aspect-[4/5] bg-gray-200 grid place-items-center relative overflow-hidden">
                  <svg viewBox="0 0 100 130" className="w-2/3 text-gray-400">
                    <ellipse cx="50" cy="30" rx="18" ry="22" fill="currentColor" />
                    <path d="M28 130 Q28 65 50 65 Q72 65 72 130 Z" fill="currentColor" />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/80 px-2 py-1 text-[10px] text-center text-gray-500">
                    No free image available
                  </div>
                </div>
                <dl className="px-3 py-3 space-y-1.5 text-[13px]">
                  {INFOBOX_DATA.map(([k, v]) => {
                    let displayValue = v;
                    if (k === 'Status') displayValue = infoboxStatus;
                    if (k === 'Known for') displayValue = infoboxKnownFor;
                    const isDeath = k === 'Status' && infoboxStatus === 'Deceased';
                    return (
                      <div key={k} className="grid grid-cols-[90px_1fr] gap-1 border-b border-gray-100 pb-1">
                        <dt className="text-gray-500 font-medium">{k}</dt>
                        <dd className={`text-gray-800 ${isDeath ? 'text-red-700 font-medium' : ''}`}>{displayValue}</dd>
                      </div>
                    );
                  })}
                  
                  {/* Endless Loading fields when Override Two is active */}
                  {showOverrideTwo && (
                    <>
                      <div className="grid grid-cols-[90px_1fr] gap-1 border-b border-gray-100 pb-1 text-red-700 font-bold animate-pulse">
                        <dt className="text-red-900 font-medium">Date and Time</dt>
                        <dd className="font-mono">LOADING...</dd>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] gap-1 border-b border-gray-100 pb-1 text-red-700 font-bold animate-pulse">
                        <dt className="text-red-900 font-medium">Cause of Death</dt>
                        <dd className="font-mono">LOADING...</dd>
                      </div>
                    </>
                  )}
                </dl>
                <div className="border-t border-gray-200 px-3 py-2 flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock size={11} /> last edited {lastEdit} · {editCount} edits
                </div>
              </div>

              {/* Edit count warning */}
              {editCount > 5 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-start gap-1.5"
                  style={{ animation: 'wikiReveal 0.5s ease-out' }}
                >
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>This article has been edited {editCount} times in this session. Unusual activity detected.</span>
                </div>
              )}

            </aside>
          </div>
        </article>
      ) : (
        <HistoryView history={editHistory} count={editCount} />
      )}

      {/* Edit Modal */}
      {editingSectionId && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-mono text-gray-700">
                Editing: {sections.find(s => s.id === editingSectionId)?.title}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white font-mono hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Save size={12} /> Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 rounded text-xs bg-gray-100 text-gray-600 font-mono hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full h-64 bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="Edit this section..."
                autoFocus
              />
              <p className="text-[10px] text-gray-400 mt-2 font-mono">
                Tip: Try removing certain lines or typing specific phrases to see what happens.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wikiReveal {
          from { opacity: 0; transform: translateY(4px); background-color: #fef3c7; }
          50% { background-color: #fef3c7; }
          to { opacity: 1; transform: translateY(0); background-color: transparent; }
        }
      `}</style>
    </div>
  );
}

function HistoryView({ history, count }: { history: EditRecord[]; count: number }) {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <History size={18} className="text-gray-400" />
        <h1 className="text-2xl font-serif text-gray-900">Revision history</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        "Neil Sharma" — {count} revisions · viewing latest
      </p>

      <div className="space-y-2">
        {history.map((e, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded border hover:bg-gray-50 ${
              i === 0 ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-200 bg-white'
            }`}
            style={i === 0 ? { animation: 'wikiReveal 0.5s ease-out' } : undefined}
          >
            <div className={`h-2 w-2 rounded-full mt-2 ${e.bytes > 0 ? 'bg-green-500' : e.bytes < 0 ? 'bg-red-500' : 'bg-gray-400'}`} />
            <div className="flex-1">
              <div className="text-sm text-gray-800">{e.summary}</div>
              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span className="text-blue-600">{e.user}</span>
                <span>·</span>
                <span>{e.time}</span>
                <span>·</span>
                <span className={e.bytes >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {e.bytes >= 0 ? '+' : ''}{e.bytes} bytes
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200">prev</button>
              <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200">cur</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-3 rounded bg-gray-50 border border-gray-200 text-xs text-gray-400">
        Anonymous editors are identified by IP hash. Some entries may have been modified after the fact.
      </div>
    </div>
  );
}
