import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { HistoryEntry, Tab, Host, ParsedUrl } from './types';
import { HOST_FAVICONS, HOST_TITLES, parseUrl } from './urls';

const STORAGE_KEY = 'veil.browser.v1';

interface SavedState {
  tabs: Tab[];
  activeId: string;
}

function newTab(initial: 'home' | ParsedUrl = 'home'): Tab {
  let entry: HistoryEntry;
  if (initial === 'home') {
    entry = { url: 'home', displayUrl: 'browse://', host: 'home', path: '', ts: Date.now() };
  } else {
    entry = { url: initial.raw, displayUrl: initial.displayUrl, host: initial.host, path: initial.path, ts: Date.now() };
  }
  const h = initial === 'home' ? 'home' : initial.host;
  return {
    id: Math.random().toString(36).slice(2, 9),
    title: HOST_TITLES[h],
    favicon: HOST_FAVICONS[h],
    history: [entry],
    cursor: 0,
    loading: false,
  };
}

function load(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as SavedState;
      if (s.tabs && s.tabs.length && s.activeId) return s;
    }
  } catch {
    /* ignore */
  }
  const t = newTab();
  return { tabs: [t], activeId: t.id };
}

export interface NavigateOpts {
  delay?: number;
  titleOverride?: string;
}

interface BrowserContextValue {
  tabs: Tab[];
  activeId: string;
  active: Tab;
  setActive: (id: string) => void;
  openTab: (initial?: 'home' | ParsedUrl) => void;
  closeTab: (id: string) => void;
  navigate: (input: string, opts?: NavigateOpts) => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  canBack: boolean;
  canForward: boolean;
  setLoading: (b: boolean) => void;
  // crew control broadcast
  broadcast: (channel: string, payload?: unknown) => void;
  subscribe: (channel: string, cb: (p: unknown) => void) => () => void;
}

const Ctx = createContext<BrowserContextValue | null>(null);

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [{ tabs, activeId }, setState] = useState<SavedState>(load);
  const channels = useRef<Map<string, Set<(p: unknown) => void>>>(new Map());
  const navDelays = useRef<Map<string, number>>(new Map());
  const pendingReload = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeId }));
  }, [tabs, activeId]);

  const patchTab = useCallback((id: string, fn: (t: Tab) => Tab) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? fn(t) : t)),
    }));
  }, []);

  const active = useMemo(() => tabs.find((t) => t.id === activeId) ?? tabs[0], [tabs, activeId]);

  const broadcast = useCallback((channel: string, payload?: unknown) => {
    const subs = channels.current.get(channel);
    if (subs) subs.forEach((cb) => cb(payload));
  }, []);

  const subscribe = useCallback((channel: string, cb: (p: unknown) => void) => {
    let set = channels.current.get(channel);
    if (!set) {
      set = new Set();
      channels.current.set(channel, set);
    }
    set.add(cb);
    return () => {
      set!.delete(cb);
    };
  }, []);

  const setActive = useCallback((id: string) => setState((s) => ({ ...s, activeId: id })), []);

  const openTab = useCallback(
    (initial: 'home' | ParsedUrl = 'home') => {
      const t = newTab(initial);
      setState((s) => ({ tabs: [...s.tabs, t], activeId: t.id }));
    },
    [],
  );

  const closeTab = useCallback((id: string) => {
    setState((s) => {
      if (s.tabs.length === 1) {
        const t = newTab();
        return { tabs: [t], activeId: t.id };
      }
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const newActive = id === s.activeId ? tabs[Math.max(0, idx - 1)].id : s.activeId;
      return { tabs, activeId: newActive };
    });
  }, []);

  const setLoading = useCallback(
    (b: boolean) => patchTab(activeId, (t) => ({ ...t, loading: b })),
    [activeId, patchTab],
  );

  const navigate = useCallback(
    async (input: string, opts: NavigateOpts = {}) => {
      const parsed = parseUrl(input);
      const delay = opts.delay ?? 380 + Math.random() * 420;
      const tabId = activeId;
      patchTab(tabId, (t) => ({ ...t, loading: true }));
      navDelays.current.set(tabId, Date.now() + delay);
      await new Promise((r) => setTimeout(r, delay));
      const entry: HistoryEntry = {
        url: input,
        displayUrl: parsed.displayUrl,
        host: parsed.host,
        path: parsed.path,
        ts: Date.now(),
      };
      patchTab(tabId, (t) => {
        const trimmed = t.history.slice(0, t.cursor + 1);
        const next = [...trimmed, entry];
        return {
          ...t,
          history: next,
          cursor: next.length - 1,
          loading: false,
          title: opts.titleOverride ?? HOST_TITLES[parsed.host],
          favicon: HOST_FAVICONS[parsed.host],
        };
      });
      broadcast('nav', { tabId, entry });
    },
    [activeId, patchTab, broadcast],
  );

  const goBack = useCallback(() => {
    patchTab(activeId, (t) =>
      t.cursor > 0
        ? (() => {
            const c = t.cursor - 1;
            const e = t.history[c];
            return { ...t, cursor: c, title: HOST_TITLES[e.host], favicon: HOST_FAVICONS[e.host], loading: false };
          })()
        : t,
    );
  }, [activeId, patchTab]);

  const goForward = useCallback(() => {
    patchTab(activeId, (t) =>
      t.cursor < t.history.length - 1
        ? (() => {
            const c = t.cursor + 1;
            const e = t.history[c];
            return { ...t, cursor: c, title: HOST_TITLES[e.host], favicon: HOST_FAVICONS[e.host], loading: false };
          })()
        : t,
    );
  }, [activeId, patchTab]);

  const reload = useCallback(() => {
    pendingReload.current.add(activeId);
    patchTab(activeId, (t) => ({ ...t, loading: true }));
    setTimeout(() => {
      patchTab(activeId, (t) => ({ ...t, loading: false }));
      broadcast('reload', { tabId: activeId });
    }, 600 + Math.random() * 400);
  }, [activeId, patchTab, broadcast]);

  const value: BrowserContextValue = {
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
    canBack: active.cursor > 0,
    canForward: active.cursor < active.history.length - 1,
    setLoading,
    broadcast,
    subscribe,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBrowser() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBrowser must be used within BrowserProvider');
  return v;
}

export function useCrew(channel: string, cb: (p: unknown) => void) {
  const { subscribe } = useBrowser();
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => subscribe(channel, (p) => ref.current(p)), [channel, subscribe]);
}

export function useActiveEntry() {
  const { active } = useBrowser();
  return active.history[active.cursor] ?? active.history[0];
}

export function useActiveHost(): Host {
  const e = useActiveEntry();
  return e?.host ?? 'home';
}
