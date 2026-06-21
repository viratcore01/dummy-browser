import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { BrowserProvider, useActiveHost } from './browser/store';
import SystemBar, { NotificationStack } from './browser/SystemBar';
import BrowserFrame from './browser/BrowserFrame';
import CrewControls from './browser/CrewControls';

export default function App() {
  return (
    <BrowserProvider>
      <AppShell />
    </BrowserProvider>
  );
}

function AppShell() {
  const [fullscreen, setFullscreen] = useState(false);
  const host = useActiveHost();

  // subtle ambient tint per host for cinematic framing
  const tint =
    host === 'veil'
      ? 'from-black via-ink-950 to-[#0a0608]'
      : host === 'atlas'
      ? 'from-ink-950 via-ink-950 to-[#080a0c]'
      : 'from-ink-950 via-ink-950 to-ink-950';

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F11' && e.code !== 'F11') return;

      e.preventDefault();

      const toggle = async () => {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }

        await rootRef.current?.requestFullscreen?.({ navigationUI: 'hide' });
      };

      void toggle();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKey);
    };
  }, []);


  return (
    <div
      ref={rootRef}
      className={`h-screen w-screen flex flex-col bg-gradient-to-b ${tint} ${fullscreen ? '' : 'p-0 sm:p-6'}`}
    >
      {/* OS-style window chrome */}
      {!fullscreen && (
        <div className="rounded-2xl overflow-hidden ring-1 ring-ink-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] flex flex-col flex-1 min-h-0">
          <SystemBar />
          <div className="relative flex-1 min-h-0">
            <BrowserFrame />
            <NotificationStack />
          </div>
        </div>
      )}
      {fullscreen && (
        <div className="flex-1 min-h-0 flex flex-col">
          <SystemBar />
          <div className="relative flex-1 min-h-0">
            <BrowserFrame />
            <NotificationStack />
          </div>
        </div>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen((f) => !f)}
        className="fixed top-2 right-2 z-[95] h-7 w-7 grid place-items-center rounded-md bg-ink-850/70 backdrop-blur text-ink-400 hover:text-ink-50 hover:bg-ink-800 transition"
        aria-label="Toggle fullscreen"
      >
        {fullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
      </button>

      <CrewControls />
    </div>
  );
}
