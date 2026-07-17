import { useEffect, useRef, useState } from 'react';
import { useBrowser } from './store';
import DemoPlayer from './DemoPlayer';

/**
 * Hidden keyboard controls for the crew.
 * Keys are caught globally and routed to sites or system effects.
 *
 *  1 → open wiki.local/neil
 *  2 → trigger live wiki article change
 *  3 → open veil.onion/live
 *  4 → bump livestream viewer count
 *  5 → force an ATLAS reply
 *  6 → remote "user" message into ATLAS (someone else typing)
 *  7 → log a system event
 *  8 → simulate fake network lag spike on current tab
 *  9 → cursor ghost effect (brief flicker)
 *  0 → blackout the screen
 *  D → play/stop Wikipedia horror demo
 *  Esc → release blackout
 */
export default function CrewControls() {
  const { navigate, broadcast, setLoading, active } = useBrowser();
  const [blackout, setBlackout] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const demoRunningRef = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const editable = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape' || e.key === 'Meta' || e.ctrlKey || e.metaKey) {
        if (e.key === 'Escape' && blackout) setBlackout(false);
        return;
      }

      if (e.key.toLowerCase() === 'd' && !editable) {
        e.preventDefault();
        demoRunningRef.current = !demoRunningRef.current;
        broadcast('wiki:demo-toggle', { running: demoRunningRef.current });
        return;
      }

      switch (e.key) {
        case '1':
          if (editable) return;
          void navigate('wiki.local/neil', { titleOverride: 'Veilpedia — Neil' });
          broadcast('wiki:open', {});
          break;
        case '2':
          broadcast('wiki:add', {});
          console.log('Article updated: New paragraph added to “Neil”.');
          break;
        case '3':
          if (editable) return;
          void navigate('veil.onion/live', { titleOverride: 'VEIL // LIVE' });
          break;
        case '4':
          broadcast('veil:viewers', {});
          console.log('Viewer influx: +24 viewers joined the broadcast.');
          break;
        case '5':
          broadcast('atlas:reply', {});
          console.log('ATLAS is composing a reply…');
          break;
        case '6':
          broadcast('atlas:remote', 'user');
          break;
        case '7':
          console.log('System: An unknown process is responding.');
          break;
        case '8':
          if (editable) return;
          setLoading(true);
          console.log('Network: Lag spike detected on exit node.');
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
          crew: <span className="text-accent">1</span> wiki · <span className="text-accent">2</span> article change · <span className="text-accent">3</span> live · <span className="text-accent">4</span> viewers · <span className="text-accent">5</span> atlas reply · <span className="text-accent">0</span> blackout · <span className="text-accent">D</span> demo
        </div>
      )}
      <DemoPlayer />
    </>
  );
}

