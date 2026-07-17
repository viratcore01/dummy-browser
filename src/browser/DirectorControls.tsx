import { useEffect, useState, useCallback } from 'react';
import { useBrowser } from './store';
import { useScript } from './ScriptEngine';
import {
  Eye, EyeOff, Skull, BookOpen, MessageSquare, RotateCcw,
  ChevronRight, Monitor, Zap, Volume2, Play, SkipForward, History, X
} from 'lucide-react';

/**
 * Director Control Panel for OMEN
 * 
 * Toggle: ~ (backtick) or Ctrl+Shift+C
 * 
 * Hotkeys (always active, even when panel is hidden):
 *   F1 → Next Omen AI response
 *   F2 → Force Wikipedia update
 *   F3 → Next DarkWeb chat message
 *   Space → Trigger next livestream event (when not typing)
 *   1-9 → Quick navigation
 */
export default function DirectorControls() {
  const { navigate, broadcast, setLoading } = useBrowser();
  const script = useScript();
  const [panelOpen, setPanelOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    setActionLog(prev => [...prev.slice(-12), `${new Date().toLocaleTimeString()} — ${msg}`]);
  }, []);

  // ─── F1: Next Omen Response ───────────────
  const triggerOmenNext = useCallback(() => {
    const msg = script.getNextOmenMessage();
    if (!msg) {
      log('OMEN: No more messages in current conversation');
      return;
    }
    broadcast('omen:next', msg);
    script.advanceOmen();
    log(`OMEN [${msg.role}]: "${msg.text.substring(0, 50)}..."`);
  }, [script, broadcast, log]);

  // ─── F2: Wikipedia Update ─────────────────
  const triggerWikiUpdate = useCallback(() => {
    const update = script.getNextWikiUpdate();
    if (!update) {
      log('WIKI: No more updates');
      return;
    }
    broadcast('wiki:force-update', update);
    script.advanceWiki();
    log(`WIKI: "${update.section_title}" by ${update.editor}`);
  }, [script, broadcast, log]);

  // ─── F3: DarkWeb Chat ────────────────────
  const triggerDarkWebChat = useCallback(() => {
    const msg = script.getNextDarkWebMessage();
    if (!msg) {
      log('DARKWEB: No more scripted messages');
      return;
    }
    broadcast('darkweb:chat', msg);
    script.advanceDarkWeb();
    log(`DARKWEB [${msg.user}]: "${msg.text.substring(0, 50)}"`);
  }, [script, broadcast, log]);

  // ─── Space: Livestream Event ──────────────
  const triggerLivestreamEvent = useCallback(() => {
    broadcast('darkweb:livestream-event', {});
    log('LIVESTREAM: Triggered event');
  }, [broadcast, log]);

  // ─── Keyboard Handler ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA';
      const isContentEditable = (e.target as HTMLElement)?.isContentEditable;

      // Panel toggle: ~ or Ctrl+Shift+C
      if (e.key === '`' || e.key === '~') {
        if (!isEditable && !isContentEditable) {
          e.preventDefault();
          setPanelOpen(p => !p);
          return;
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setPanelOpen(p => !p);
        return;
      }

      // F-key hotkeys (always work)
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          triggerOmenNext();
          return;
        case 'F2':
          e.preventDefault();
          triggerWikiUpdate();
          return;
        case 'F3':
          e.preventDefault();
          triggerDarkWebChat();
          return;
        case 'F4':
          e.preventDefault();
          // bump viewers
          broadcast('darkweb:viewers', {});
          log('DARKWEB: Viewer count bumped');
          return;
        case 'F5':
          e.preventDefault();
          log('NOTIFY: Omen warning');
          return;
        case 'F6':
          e.preventDefault();
          log('NOTIFY: Phone call');
          return;
        case 'F7':
          e.preventDefault();
          // buffering effect
          broadcast('darkweb:buffer', {});
          log('DARKWEB: Buffer triggered');
          return;
        case 'F8':
          e.preventDefault();
          setBlackout(true);
          log('SYSTEM: Blackout');
          return;
      }

      // Don't process further if user is typing
      if (isEditable || isContentEditable) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          triggerLivestreamEvent();
          break;
        case 'Escape':
          if (blackout) setBlackout(false);
          break;
        // Quick navigation
        case '1':
          void navigate('omen.chat', { titleOverride: 'Omen - Chat' });
          log('NAV: Opened Omen Chat');
          break;
        case '2':
          void navigate('en.wikipedia.org/wiki/Neil_Sharma', { titleOverride: 'Wikipedia — Neil Sharma' });
          log('NAV: Opened Wikipedia');
          break;
        case '3':
          void navigate('darkweb-violence.onion/live', { titleOverride: 'DarkWeb Violence' });
          log('NAV: Opened DarkWeb');
          break;
        case '8':
          setLoading(true);
          log('SYSTEM: Lag spike');
          setTimeout(() => setLoading(false), 2200);
          break;
        case '9':
          document.body.style.cursor = 'none';
          setTimeout(() => (document.body.style.cursor = ''), 1400);
          log('SYSTEM: Cursor hidden');
          break;
        case '0':
          setBlackout(true);
          log('SYSTEM: Blackout');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, broadcast, setLoading, blackout, triggerOmenNext, triggerWikiUpdate, triggerDarkWebChat, triggerLivestreamEvent, log]);

  return (
    <>
      {/* Blackout overlay */}
      {blackout && (
        <div
          className="fixed inset-0 z-[200] bg-black grid place-items-center cursor-pointer"
          onClick={() => setBlackout(false)}
        >
          <div className="text-ink-700 text-xs font-mono opacity-30 animate-pulse">signal lost</div>
        </div>
      )}

      {/* Director Panel */}
      {panelOpen && (
        <div className="fixed inset-y-0 right-0 z-[150] w-[380px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-red-900/30 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-red-900/20 bg-red-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-red-500" />
                <span className="text-sm font-bold text-red-400 tracking-wider">DIRECTOR PANEL</span>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-red-900 hover:text-red-500 text-xs">
                [ESC]
              </button>
            </div>
            <div className="text-[10px] text-red-900 mt-1 font-mono">
              OMEN Part 1 · Not visible on camera
            </div>
          </div>

          {/* Scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Script Status */}
            <PanelSection title="SCRIPT STATUS" icon={<Zap size={13} />}>
              <StatusRow 
                label="Omen Conv" 
                value={`#${script.state.omenConversation} — Msg ${script.state.omenMessageIndex}/${script.state.omenMessages.length}`}
              />
              <StatusRow 
                label="Wiki Updates" 
                value={`${script.state.wikiUpdateIndex}/${script.state.wikiUpdates.length} applied`} 
              />
              <StatusRow 
                label="DarkWeb Chat" 
                value={`${script.state.darkwebChatIndex}/${script.state.darkwebMessages.length} sent`} 
              />
            </PanelSection>

            {/* Quick Actions */}
            <PanelSection title="QUICK ACTIONS" icon={<Play size={13} />}>
              <ActionButton
                icon={<MessageSquare size={13} />}
                label="Next Omen Response"
                hotkey="F1"
                onClick={triggerOmenNext}
                color="purple"
              />
              <ActionButton
                icon={<BookOpen size={13} />}
                label="Force Wiki Update"
                hotkey="F2"
                onClick={triggerWikiUpdate}
                color="yellow"
              />
              <ActionButton
                icon={<Skull size={13} />}
                label="Next DarkWeb Chat"
                hotkey="F3"
                onClick={triggerDarkWebChat}
                color="red"
              />
              <ActionButton
                icon={<Volume2 size={13} />}
                label="Livestream Event"
                hotkey="Space"
                onClick={triggerLivestreamEvent}
                color="green"
              />
            </PanelSection>

            {/* Navigation */}
            <PanelSection title="NAVIGATION" icon={<ChevronRight size={13} />}>
              <NavButton label="Omen Chat" hotkey="1" onClick={() => void navigate('omen.chat')} />
              <NavButton label="Wikipedia" hotkey="2" onClick={() => void navigate('en.wikipedia.org/wiki/Neil_Sharma')} />
              <NavButton label="DarkWeb" hotkey="3" onClick={() => void navigate('darkweb-violence.onion/live')} />
            </PanelSection>

            {/* Omen Conversation Switcher */}
            <PanelSection title="OMEN CONVERSATION" icon={<Eye size={13} />}>
              <div className="flex gap-2">
                <button
                  onClick={() => script.switchOmenConversation(1)}
                  className={`flex-1 px-3 py-2 rounded text-xs font-mono border ${
                    script.state.omenConversation === 1
                      ? 'bg-purple-900/40 border-purple-700 text-purple-300'
                      : 'bg-transparent border-red-900/30 text-red-900 hover:text-red-700'
                  }`}
                >
                  #1 Profile Reveal
                </button>
                <button
                  onClick={() => script.switchOmenConversation(2)}
                  className={`flex-1 px-3 py-2 rounded text-xs font-mono border ${
                    script.state.omenConversation === 2
                      ? 'bg-purple-900/40 border-purple-700 text-purple-300'
                      : 'bg-transparent border-red-900/30 text-red-900 hover:text-red-700'
                  }`}
                >
                  #2 GF Hints
                </button>
              </div>
            </PanelSection>

            {/* Search History */}
            <PanelSection title="SEARCH HISTORY" icon={<History size={13} />}>
              <ActionButton
                icon={<History size={13} />}
                label="Toggle History Drawer"
                hotkey="H"
                onClick={() => broadcast('search:toggle-history', {})}
                color="yellow"
              />
              <ActionButton
                icon={<X size={13} />}
                label="Clear Search History"
                hotkey=""
                onClick={() => {
                  broadcast('search:clear-history', {});
                  log('SEARCH: History cleared');
                }}
                color="gray"
              />
              <ActionButton
                icon={<RotateCcw size={13} />}
                label="Restore Search History"
                hotkey=""
                onClick={() => {
                  broadcast('search:restore-history', {});
                  log('SEARCH: History restored');
                }}
                color="green"
              />
            </PanelSection>

            {/* Notifications */}
            <PanelSection title="TRIGGER NOTIFICATIONS" icon={<Zap size={13} />}>
              <ActionButton
                icon={<Eye size={13} />}
                label="Omen Warning"
                hotkey="F5"
                onClick={() => log('NOTIFY: Omen warning')}
                color="purple"
              />
              <ActionButton
                icon={<SkipForward size={13} />}
                label="Phone: Suyanshi"
                hotkey="F6"
                onClick={() => log('NOTIFY: Phone call')}
                color="blue"
              />
              <ActionButton
                icon={<EyeOff size={13} />}
                label="Blackout"
                hotkey="F8"
                onClick={() => setBlackout(true)}
                color="gray"
              />
            </PanelSection>

            {/* Reset */}
            <PanelSection title="RESET" icon={<RotateCcw size={13} />}>
              <div className="flex gap-2">
                <ResetButton label="Omen" onClick={script.resetOmen} />
                <ResetButton label="Wiki" onClick={script.resetWiki} />
                <ResetButton label="DarkWeb" onClick={script.resetDarkWeb} />
                <ResetButton label="ALL" onClick={script.resetAll} danger />
              </div>
            </PanelSection>

            {/* Action Log */}
            <PanelSection title="ACTION LOG" icon={<Monitor size={13} />}>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {actionLog.length === 0 && (
                  <div className="text-[10px] text-red-900/60 font-mono">No actions yet</div>
                )}
                {actionLog.map((entry, i) => (
                  <div key={i} className="text-[10px] text-red-800/70 font-mono leading-tight">
                    {entry}
                  </div>
                ))}
              </div>
            </PanelSection>

            {/* Hotkey Reference */}
            <div className="border border-red-900/20 rounded-lg p-3 bg-red-950/10">
              <div className="text-[10px] text-red-700 font-mono space-y-1">
                <div><span className="text-red-500">~</span> Toggle panel · <span className="text-red-500">Esc</span> Exit blackout</div>
                <div><span className="text-red-500">F1</span> Omen · <span className="text-red-500">F2</span> Wiki · <span className="text-red-500">F3</span> DarkWeb</div>
                <div><span className="text-red-500">F4</span> Viewers · <span className="text-red-500">F5</span> Omen notif · <span className="text-red-500">F6</span> Phone</div>
                <div><span className="text-red-500">F7</span> Buffer · <span className="text-red-500">F8</span> Blackout · <span className="text-red-500">Space</span> Livestream</div>
                <div><span className="text-red-500">1</span> Nav Omen · <span className="text-red-500">2</span> Nav Wiki · <span className="text-red-500">3</span> Nav DarkWeb</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Startup hint (fades after 4s) */}
      <StartupHint />
    </>
  );
}

// ─── Sub-components ─────────────────────

function PanelSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-red-900/20 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-red-950/20 flex items-center gap-2 text-[10px] text-red-600 font-mono tracking-widest">
        {icon} {title}
      </div>
      <div className="p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-red-800 font-mono">{label}</span>
      <span className="text-red-500 font-mono">{value}</span>
    </div>
  );
}

function ActionButton({
  icon, label, hotkey, onClick, color
}: {
  icon: React.ReactNode; label: string; hotkey: string; onClick: () => void; color: string;
}) {
  const colors: Record<string, string> = {
    purple: 'border-purple-900/40 hover:bg-purple-900/20 text-purple-400',
    yellow: 'border-yellow-900/40 hover:bg-yellow-900/20 text-yellow-400',
    red: 'border-red-900/40 hover:bg-red-900/20 text-red-400',
    green: 'border-green-900/40 hover:bg-green-900/20 text-green-400',
    blue: 'border-blue-900/40 hover:bg-blue-900/20 text-blue-400',
    gray: 'border-gray-800/40 hover:bg-gray-800/20 text-gray-400',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded border transition-colors ${colors[color] || colors.gray}`}
    >
      {icon}
      <span className="flex-1 text-left text-[11px] font-mono">{label}</span>
      <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-red-600 border border-red-900/30 font-mono">{hotkey}</kbd>
    </button>
  );
}

function NavButton({ label, hotkey, onClick }: { label: string; hotkey: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 rounded border border-red-900/20 hover:bg-red-950/30 text-red-700 hover:text-red-500 transition-colors"
    >
      <ChevronRight size={11} />
      <span className="flex-1 text-left text-[11px] font-mono">{label}</span>
      <kbd className="text-[9px] px-1 py-0.5 rounded bg-black/30 text-red-800 font-mono">{hotkey}</kbd>
    </button>
  );
}

function ResetButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono border transition-colors ${
        danger
          ? 'border-red-700/40 text-red-500 hover:bg-red-900/30'
          : 'border-red-900/20 text-red-800 hover:bg-red-950/30 hover:text-red-600'
      }`}
    >
      ↺ {label}
    </button>
  );
}

function StartupHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-lg bg-red-950/60 backdrop-blur text-[11px] text-red-500/80 font-mono border border-red-900/30"
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      director: <span className="text-red-400">~</span> panel ·{' '}
      <span className="text-red-400">F1</span> omen ·{' '}
      <span className="text-red-400">F2</span> wiki ·{' '}
      <span className="text-red-400">F3</span> darkweb ·{' '}
      <span className="text-red-400">Space</span> livestream
    </div>
  );
}
