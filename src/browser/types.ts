export type Host =
  | 'home'
  | 'wiki'
  | 'darkweb'
  | 'omen'
  | 'search'
  | 'error';

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

export interface DarkWebChatLine {
  id: number;
  user: string;
  text: string;
  color: string;
  isSpecial?: boolean;
}

export interface WikiUpdate {
  id: string;
  section_title: string;
  text: string;
  edit_summary: string;
  editor: string;
  applied?: boolean;
  loading?: boolean;
}

export interface Section {
  id: string;
  title: string;
  body: string[];
  open: boolean;
}

export interface EditRecord {
  user: string;
  time: string;
  summary: string;
  bytes: number;
}
