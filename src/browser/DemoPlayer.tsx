import { useEffect, useRef, useState } from 'react';
import { useBrowser } from './store';

type Step =
  | { kind: 'navigate'; to: string; title?: string }
  | { kind: 'wait'; ms: number }
  | { kind: 'edit'; sectionId: string; removeLines: string[] }
  | { kind: 'broadcast'; channel: string; payload?: unknown }
  | { kind: 'type'; text: string };

const WIKI_STEPS: Step[] = [
  { kind: 'navigate', to: 'wiki.local/neil', title: 'Veilpedia — Neil' },
  { kind: 'wait', ms: 1200 },
  { kind: 'edit', sectionId: 'personal-life', removeLines: ['cheating', 'best friend', 'infidelity'] },
  { kind: 'wait', ms: 1800 },
  { kind: 'edit', sectionId: 'personal-life', removeLines: ['broke up', 'breakup', 'girlfriend broke'] },
  { kind: 'wait', ms: 1800 },
  { kind: 'edit', sectionId: 'family', removeLines: ['parents', 'family', 'parents died'] },
  { kind: 'wait', ms: 1800 },
  { kind: 'edit', sectionId: 'incidents', removeLines: ['girlfriend', 'found dead'] },
  { kind: 'wait', ms: 1800 },
  { kind: 'type', text: 'At last everything got better and no one died.' },
  { kind: 'wait', ms: 2000 },
];

export default function DemoPlayer() {
  const { navigate, broadcast, subscribe } = useBrowser();
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const runningRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const runStep = (index: number) => {
    if (index >= WIKI_STEPS.length) {
      setRunning(false);
      runningRef.current = false;
      setStepIndex(0);
      return;
    }

    setStepIndex(index);
    const step = WIKI_STEPS[index];

    if (step.kind === 'navigate') {
      void navigate(step.to, { titleOverride: step.title });
      runStep(index + 1);
      return;
    }

    if (step.kind === 'wait') {
      timerRef.current = setTimeout(() => runStep(index + 1), step.ms);
      return;
    }

    if (step.kind === 'broadcast') {
      broadcast(step.channel, step.payload);
      runStep(index + 1);
      return;
    }

    if (step.kind === 'edit') {
      broadcast('wiki:demo-edit', {
        sectionId: step.sectionId,
        removeLines: step.removeLines,
      });
      timerRef.current = setTimeout(() => runStep(index + 1), 600);
      return;
    }

    if (step.kind === 'type') {
      broadcast('wiki:demo-type', { text: step.text });
      runStep(index + 1);
      return;
    }
  };

  const start = () => {
    setRunning(true);
    runningRef.current = true;
    setStepIndex(0);
    runStep(0);
  };

  const stop = () => {
    clearTimer();
    setRunning(false);
    runningRef.current = false;
    setStepIndex(0);
  };

  useEffect(() => {
    const unsub = subscribe('wiki:demo-toggle', (p) => {
      const payload = p as { running?: boolean } | null;
      const shouldRun = payload?.running ?? !runningRef.current;
      if (shouldRun && !runningRef.current) {
        start();
      } else if (!shouldRun && runningRef.current) {
        stop();
      }
    });
    return unsub;
  }, [subscribe, navigate, broadcast]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-[400] flex items-center gap-2">
      {!running ? (
        <button
          onClick={start}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-mono hover:bg-red-500 border border-red-500 shadow-lg"
        >
          PLAY DEMO
        </button>
      ) : (
        <button
          onClick={stop}
          className="px-3 py-1.5 rounded-lg bg-ink-800 text-ink-100 text-xs font-mono hover:bg-ink-700 border border-ink-700 shadow-lg"
        >
          STOP DEMO ({stepIndex + 1}/{WIKI_STEPS.length})
        </button>
      )}
    </div>
  );
}
