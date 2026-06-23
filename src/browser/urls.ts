import type { Host, ParsedUrl } from './types';

const KNOWN: Record<string, Host> = {
  'wiki.local': 'wiki',
  'veil.onion': 'veil',
  'atlas.chat': 'atlas',
  'browse.search': 'search',
  'community.local': 'community',
  'profile.local': 'profile',
};

export const HOST_TITLES: Record<Host, string> = {
  home: 'New Tab',
  wiki: 'Veilpedia — Neil',
  veil: 'VEIL // LIVE',
  atlas: 'ATLAS',
  search: 'Browse',
  error: 'Page Unavailable',
  community: 'Community',
  profile: 'Profile',
};

export const HOST_FAVICONS: Record<Host, string> = {
  home: 'circle',
  wiki: 'book',
  veil: 'radio',
  atlas: 'sparkles',
  search: 'search',
  error: 'triangle-alert',
  community: 'users',
  profile: 'user',
};

export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim();
  if (raw === '') {
    return blank('home', 'about:newtab');
  }
  if (raw.toLowerCase() === 'home' || raw.toLowerCase() === 'browse' || raw === 'about:newtab') {
    return { raw, host: 'home', path: '', displayUrl: 'browse://' };
  }
  // search detection
  if (!raw.includes('.') && !raw.includes('/')) {
    return {
      raw,
      host: 'search',
      path: encodeURIComponent(raw),
      displayUrl: `browse://${raw}`,
    };
  }
  const noProto = raw.replace(/^https?:\/\//i, '').replace(/^browse:\/\//i, '');
  const slash = noProto.indexOf('/');
  const domain = slash === -1 ? noProto : noProto.slice(0, slash);
  const path = slash === -1 ? '' : noProto.slice(slash);
  const host = KNOWN[domain.toLowerCase()];
  if (host) {
    return {
      raw,
      host,
      path,
      displayUrl: `${domain}${path}`,
    };
  }
  // unknown domain — 404
  return {
    raw,
    host: 'error',
    path: domain,
    displayUrl: domain + path,
  };
}

export function blank(host: Host, displayUrl: string): ParsedUrl {
  return { raw: '', host, path: '', displayUrl };
}

export function isKnown(input: string): boolean {
  const p = parseUrl(input);
  return p.host !== 'error';
}
