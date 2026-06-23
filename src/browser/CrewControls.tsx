import { useEffect, useState } from 'react';
import { useBrowser } from './store';

/**
 * Hidden keyboard controls for the crew.
 * Keys are caught globally and routed to sites or system effects.
 *
 *  1 → open wiki.local/neil
 *  2 → trigger live wiki article change
 *  3 → open veil.onion/live
 *  4 → next user line in ATLAS script
 *  5 → next AI line in ATLAS script
 *  6 → remote "user" message into ATLAS (someone else typing)
 *  7 → drop a notification
 *  8 → simulate fake network lag spike on current tab
 *  9 → cursor ghost effect (brief flicker)
 *  0 → blackout the screen
 *  Esc → release blackout
 */
export default function CrewControls() {
  const { navigate, broadcast, setLoading, active } = useBrowser();
  const [blackout, setBlackout] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // don't hijack typing
      const tag = (e.target as HTMLElement | null)?.tagName;
      const editable = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape' || e.key === 'Meta' || e.ctrlKey || e.metaKey) {
        if (e.key === 'Escape' && blackout) setBlackout(false);
        return;
      }

      // numeric panel always works except when actively typing
      switch (e.key) {
        case '1':
          if (editable) return;
          void navigate('wiki.local/neil', { titleOverride: 'Veilpedia — Neil' });
          broadcast('wiki:open', {});
          break;
        case '2':
          broadcast('wiki:add', {});
          fire('notify', { title: 'Article updated', body: 'New paragraph added to “Neil”.', from: 'veilpedia' });
          break;
        case '3':
          if (editable) return;
          void navigate('veil.onion/live', { titleOverride: 'VEIL // LIVE' });
          break;
        case '4':
          broadcast('atlas:user', {});
          fire('notify', { title: 'ATLAS', body: 'User line injected', from: 'atlas.chat' });
          break;
        case '5':
          broadcast('atlas:ai', {});
          fire('notify', { title: 'ATLAS', body: 'ATLAS is composing a reply…', from: 'atlas.chat' });
          break;
        case '6':
          broadcast('atlas:remote', 'user');
          break;
        case '7':
          fire('notify', { title: 'System', body: 'An unknown process is responding.', from: 'system' });
          break;
        case '8':
          if (editable) return;
          setLoading(true);
          fire('notify', { title: 'Network', body: 'Lag spike detected on exit node.', from: 'network' });
          setTimeout(() => setLoading(false), 2200);
          break;
        case '9':
          document.body.style.cursor = 'none';
          setTimeout(() => (document.body.style.cursor = ''), 1400);
          break;
        case '0':
          if (editable) return;
          setBlackout(true);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, broadcast, setLoading, blackout, active?.id]);

  // reveal controls briefly on first load (for crew orientation, invisible to audience)
  useEffect(() => {
    setShowHint(true);
    const id = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {blackout && (
        <div
          className="fixed inset-0 z-[100] bg-black grid place-items-center"
          onClick={() => setBlackout(false)}
        >
          <div className="text-ink-700 text-xs font-mono opacity-40">signal lost</div>
        </div>
      )}
      {showHint && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-lg bg-ink-850/80 backdrop-blur text-[11px] text-ink-400 font-mono border border-ink-700">
          crew: <span className="text-accent">1</span> wiki · <span className="text-accent">2</span> article change · <span className="text-accent">3</span> live · <span className="text-accent">4</span> user line · <span className="text-accent">5</span> AI line · <span className="text-accent">0</span> blackout
        </div>
      )}
    </>
  );
}

function fire(_type: string, payload: { title: string; body: string; from: string }) {
  window.dispatchEvent(new CustomEvent('veil:notify', { detail: payload }));
}
