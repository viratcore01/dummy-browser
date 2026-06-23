import { lazy, Suspense } from 'react';
import { useActiveHost } from './useBrowser';
import HomePage from '../sites/HomePage';
import ErrorPage from './ErrorPage';

const Wiki = lazy(() => import('../sites/Wiki'));
const Livestream = lazy(() => import('../sites/Livestream'));
const Atlas = lazy(() => import('../sites/Atlas'));
const Search = lazy(() => import('../sites/Search'));
const Community = lazy(() => import('../sites/Community'));

function ProfilePage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 text-ink-400">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="text-2xl font-semibold text-ink-100 mb-2">Profile Unavailable</div>
      <div className="text-sm text-ink-400 max-w-md mb-1">
        This profile no longer exists.
      </div>
      <div className="text-xs text-ink-500 font-mono">ERR_USER_GONE · 0xP1</div>
    </div>
  );
}

export default function PageRouter() {
  const host = useActiveHost();

  let page: React.ReactNode;
  switch (host) {
    case 'home':
      page = <HomePage />;
      break;
    case 'wiki':
      page = (
        <Suspense fallback={<Fallback />}>
          <Wiki />
        </Suspense>
      );
      break;
    case 'veil':
      page = (
        <Suspense fallback={<Fallback />}>
          <Livestream />
        </Suspense>
      );
      break;
    case 'atlas':
      page = (
        <Suspense fallback={<Fallback />}>
          <Atlas />
        </Suspense>
      );
      break;
    case 'search':
      page = (
        <Suspense fallback={<Fallback />}>
          <Search />
        </Suspense>
      );
      break;
    case 'community':
      page = (
        <Suspense fallback={<Fallback />}>
          <Community />
        </Suspense>
      );
      break;
    case 'profile':
      page = <ProfilePage />;
      break;
    case 'error':
    default:
      page = <ErrorPage />;
      break;
  }

  return <div className="h-full overflow-auto bg-ink-950">{page}</div>;
}

function Fallback() {
  return (
    <div className="h-full flex items-center justify-center text-ink-400 text-sm font-mono">
      connecting…
    </div>
  );
}
