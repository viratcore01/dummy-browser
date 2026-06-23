import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  X,
  Lock,
  Minus,
  Square,
  Shield,
  History,
  Settings2,
} from 'lucide-react';
import { useBrowser, useActiveEntry } from './store';
import Favicon from './Favicon';
import PageRouter from './PageRouter';
import LoadingOverlay from './LoadingOverlay';

export default function BrowserFrame() {
  const {
    tabs,
    activeId,
    active,
    setActive,
    openTab,
    closeTab,
    navigate,
    goBack,
    goForward,
    reload,
    canBack,
    canForward,
  } = useBrowser();
  const entry = useActiveEntry();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const displayUrl = entry?.displayUrl ?? 'browse://';
  const isSecure = entry?.host === 'wiki' || entry?.host === 'atlas' || entry?.host === 'home' || entry?.host === 'search';

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select();
  }, [editing]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setShowHistory(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const commit = () => {
    const v = draft.trim();
    setEditing(false);
    if (v && v !== displayUrl) void navigate(v);
  };

  return (
    <div className="flex flex-col h-full bg-ink-900 text-ink-100">
      {/* Tab strip */}
      <div className="flex items-stretch h-10 bg-ink-950 pl-2 pr-1 select-none">
        <div className="flex items-center px-1">
          <Favicon name="sparkles" size={16} className="text-accent" />
        </div>
        <div className="flex-1 flex items-end gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`group h-9 min-w-[120px] max-w-[200px] flex items-center gap-2 px-3 rounded-t-lg text-xs transition-colors ${
                  isActive ? 'bg-ink-900 text-ink-50' : 'bg-ink-850 hover:bg-ink-850 text-ink-300'
                }`}
              >
                <Favicon name={t.favicon} size={13} className={isActive ? 'text-accent' : 'text-ink-400'} />
                <span className="flex-1 truncate text-left">{t.title}</span>
                {t.loading && <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />}
                <X
                  size={13}
                  className="text-ink-500 opacity-0 group-hover:opacity-100 hover:bg-ink-700 rounded shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                />
              </button>
            );
          })}
          <button
            onClick={() => openTab('home')}
            className="h-9 w-9 grid place-items-center text-ink-400 hover:text-ink-100 hover:bg-ink-850 rounded-lg"
            aria-label="New tab"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 h-12 px-3 bg-ink-900 border-b border-ink-800">
        <NavBtn onClick={goBack} disabled={!canBack} label="Back">
          <ArrowLeft size={17} />
        </NavBtn>
        <NavBtn onClick={goForward} disabled={!canForward} label="Forward">
          <ArrowRight size={17} />
        </NavBtn>
        <NavBtn onClick={reload} label="Reload">
          <RotateCw size={15} className={active.loading ? 'animate-spin' : ''} />
        </NavBtn>

        <div
          className={`flex-1 flex items-center h-9 rounded-full mx-2 px-3 gap-2 transition-colors ${
            editing
              ? 'bg-ink-850 ring-1 ring-accent/60'
              : 'bg-ink-850 hover:bg-ink-800'
          }`}
        >
          {isSecure ? (
            <Lock size={12} className="text-accent shrink-0" />
          ) : (
            <Shield size={12} className="text-warn shrink-0" />
          )}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              onBlur={commit}
              spellCheck={false}
              placeholder="Search browse or type a URL"
              className="flex-1 bg-transparent outline-none text-sm text-ink-50 placeholder:text-ink-500 font-mono"
              autoFocus
            />
          ) : (
            <button
              className="flex-1 text-left text-sm font-mono truncate text-ink-100"
              onClick={() => {
                setDraft(displayUrl);
                setEditing(true);
              }}
            >
              {displayUrl}
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-0.5">
          <div className="relative" ref={historyRef}>
            <NavBtn onClick={() => setShowHistory((h) => !h)} label="History">
              <History size={14} />
            </NavBtn>
            {showHistory && (
              <div className="absolute right-0 top-10 w-72 bg-ink-850 border border-ink-700 rounded-lg shadow-2xl z-50 py-1">
                <div className="px-3 py-2 text-[11px] text-ink-500 font-mono uppercase tracking-wider border-b border-ink-700">
                  Search History
                </div>
                {active.history.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-ink-500">No entries yet</div>
                ) : (
                  active.history.slice().reverse().map((h, i) => {
                    const idx = active.history.length - 1 - i;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setShowHistory(false); void navigate(active.history[idx]?.url ?? 'home'); }}
                        className={`w-full px-3 py-2 text-left hover:bg-ink-800 flex items-center gap-2 ${
                          idx === active.cursor ? 'bg-ink-800' : ''
                        }`}
                      >
                        <History size={11} className="text-ink-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-ink-200 truncate">{h.displayUrl || h.url}</div>
                          <div className="text-[10px] text-ink-500 font-mono">{new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={settingsRef}>
            <NavBtn onClick={() => setShowSettings((s) => !s)} label="Settings">
              <Settings2 size={14} />
            </NavBtn>
            {showSettings && (
              <div className="absolute right-0 top-10 w-52 bg-ink-850 border border-ink-700 rounded-lg shadow-2xl z-50 py-1">
                <button onClick={() => { setEditing(true); setShowSettings(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50">Edit URL</button>
                <button onClick={() => { setShowSettings(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50">Clear History</button>
                <button onClick={() => { setShowSettings(false); }} className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-ink-50">Privacy Settings</button>
              </div>
            )}
          </div>
          <WinBtn><Minus size={13} /></WinBtn>
          <WinBtn><Square size={12} /></WinBtn>
          <WinBtn danger><X size={13} /></WinBtn>
        </div>
      </div>

      {/* Loading bar */}
      <div className="h-0.5 bg-ink-950 overflow-hidden">
        {active.loading && (
          <div className="h-full w-1/3 bg-accent rounded-full animate-barber" />
        )}
      </div>

      {/* Page viewport */}
      <div className="relative flex-1 overflow-hidden bg-ink-950">
        {active.loading && <LoadingOverlay />}
        <div className={`h-full transition-opacity ${active.loading ? 'opacity-30' : 'opacity-100'}`}>
          <PageRouter />
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`h-8 w-8 grid place-items-center rounded-full ${
        disabled
          ? 'text-ink-600 cursor-default'
          : 'text-ink-300 hover:bg-ink-800 hover:text-ink-50'
      } transition-colors`}
    >
      {children}
    </button>
  );
}

function WinBtn({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      className={`h-7 w-7 grid place-items-center rounded-md text-ink-400 hover:bg-ink-750 ${
        danger ? 'hover:text-danger' : 'hover:text-ink-100'
      }`}
    >
      {children}
    </button>
  );
}
