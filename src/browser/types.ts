export type Host =
  | 'home'
  | 'wiki'
  | 'veil'
  | 'atlas'
  | 'search'
  | 'error'
  | 'community'
  | 'profile';

export interface ParsedUrl {
  raw: string;
  host: Host;
  path: string;
  displayUrl: string;
}

export interface HistoryEntry {
  url: string;
  displayUrl: string;
  host: Host;
  path: string;
  ts: number;
}

export interface Tab {
  id: string;
  title: string;
  favicon: string;
  history: HistoryEntry[];
  cursor: number;
  loading: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  ts: number;
}

export interface ViewerEvent {
  id: string;
  text: string;
  ts: number;
}
