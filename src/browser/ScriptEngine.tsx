import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import scriptData from '../data/script.json';

// ─── Types ─────────────────────────────────
interface ScriptMessage {
  role: 'user' | 'ai';
  text: string;
  delay?: number;
}

interface WikiForcedUpdate {
  id: string;
  section_title: string;
  text: string;
  edit_summary: string;
  editor: string;
}

interface DarkWebScriptedMsg {
  user: string;
  text: string;
  color: string;
  isSpecial?: boolean;
}

interface ScriptState {
  // Omen Chat
  omenConversation: 1 | 2;
  omenMessageIndex: number;
  omenMessages: ScriptMessage[];
  // Wikipedia
  wikiUpdateIndex: number;
  wikiUpdates: WikiForcedUpdate[];
  // DarkWeb
  darkwebChatIndex: number;
  darkwebMessages: DarkWebScriptedMsg[];
}

interface ScriptContextValue {
  state: ScriptState;
  // Omen
  getNextOmenMessage: () => ScriptMessage | null;
  advanceOmen: () => void;
  switchOmenConversation: (conv: 1 | 2) => void;
  resetOmen: () => void;
  // Wiki
  getNextWikiUpdate: () => WikiForcedUpdate | null;
  advanceWiki: () => void;
  resetWiki: () => void;
  // DarkWeb
  getNextDarkWebMessage: () => DarkWebScriptedMsg | null;
  advanceDarkWeb: () => void;
  resetDarkWeb: () => void;
  // Meta
  resetAll: () => void;
}

const ScriptCtx = createContext<ScriptContextValue | null>(null);

function getConversationMessages(conv: 1 | 2): ScriptMessage[] {
  const data = conv === 1
    ? scriptData.omen_chat.conversation_1.messages
    : scriptData.omen_chat.conversation_2.messages;
  return data as ScriptMessage[];
}

function getWikiUpdates(): WikiForcedUpdate[] {
  return scriptData.wikipedia.forced_updates as WikiForcedUpdate[];
}

function getDarkWebMessages(): DarkWebScriptedMsg[] {
  return scriptData.darkweb.scripted_chat_messages as DarkWebScriptedMsg[];
}

function initialState(): ScriptState {
  return {
    omenConversation: 1,
    omenMessageIndex: 0,
    omenMessages: getConversationMessages(1),
    wikiUpdateIndex: 0,
    wikiUpdates: getWikiUpdates(),
    darkwebChatIndex: 0,
    darkwebMessages: getDarkWebMessages(),
  };
}

export function ScriptProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScriptState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ─── Omen ─────────────────────
  const getNextOmenMessage = useCallback((): ScriptMessage | null => {
    const s = stateRef.current;
    if (s.omenMessageIndex >= s.omenMessages.length) return null;
    return s.omenMessages[s.omenMessageIndex];
  }, []);

  const advanceOmen = useCallback(() => {
    setState(s => ({
      ...s,
      omenMessageIndex: Math.min(s.omenMessageIndex + 1, s.omenMessages.length),
    }));
  }, []);

  const switchOmenConversation = useCallback((conv: 1 | 2) => {
    setState(s => ({
      ...s,
      omenConversation: conv,
      omenMessageIndex: 0,
      omenMessages: getConversationMessages(conv),
    }));
  }, []);

  const resetOmen = useCallback(() => {
    setState(s => ({
      ...s,
      omenMessageIndex: 0,
    }));
  }, []);

  // ─── Wiki ─────────────────────
  const getNextWikiUpdate = useCallback((): WikiForcedUpdate | null => {
    const s = stateRef.current;
    if (s.wikiUpdateIndex >= s.wikiUpdates.length) return null;
    return s.wikiUpdates[s.wikiUpdateIndex];
  }, []);

  const advanceWiki = useCallback(() => {
    setState(s => ({
      ...s,
      wikiUpdateIndex: Math.min(s.wikiUpdateIndex + 1, s.wikiUpdates.length),
    }));
  }, []);

  const resetWiki = useCallback(() => {
    setState(s => ({ ...s, wikiUpdateIndex: 0 }));
  }, []);

  // ─── DarkWeb ──────────────────
  const getNextDarkWebMessage = useCallback((): DarkWebScriptedMsg | null => {
    const s = stateRef.current;
    if (s.darkwebChatIndex >= s.darkwebMessages.length) return null;
    return s.darkwebMessages[s.darkwebChatIndex];
  }, []);

  const advanceDarkWeb = useCallback(() => {
    setState(s => ({
      ...s,
      darkwebChatIndex: Math.min(s.darkwebChatIndex + 1, s.darkwebMessages.length),
    }));
  }, []);

  const resetDarkWeb = useCallback(() => {
    setState(s => ({ ...s, darkwebChatIndex: 0 }));
  }, []);

  // ─── Meta ─────────────────────
  const resetAll = useCallback(() => {
    setState(initialState());
  }, []);

  return (
    <ScriptCtx.Provider value={{
      state,
      getNextOmenMessage, advanceOmen, switchOmenConversation, resetOmen,
      getNextWikiUpdate, advanceWiki, resetWiki,
      getNextDarkWebMessage, advanceDarkWeb, resetDarkWeb,
      resetAll,
    }}>
      {children}
    </ScriptCtx.Provider>
  );
}

export function useScript() {
  const v = useContext(ScriptCtx);
  if (!v) throw new Error('useScript must be used within ScriptProvider');
  return v;
}
