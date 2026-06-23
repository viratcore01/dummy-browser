import { useContext, useEffect, useRef } from 'react';
import type { Host } from './types';
import { Ctx } from './store';

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