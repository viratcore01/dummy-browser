import { lazy, Suspense } from 'react';
import { useActiveHost } from './store';
import HomePage from '../sites/HomePage';
import ErrorPage from './ErrorPage';

const WikipediaNeil = lazy(() => import('../sites/WikipediaNeil'));
const DarkWebViolence = lazy(() => import('../sites/DarkWebViolence'));
const OmenChat = lazy(() => import('../sites/OmenChat'));
const Search = lazy(() => import('../sites/Search'));

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
          <WikipediaNeil />
        </Suspense>
      );
      break;
    case 'darkweb':
      page = (
        <Suspense fallback={<Fallback />}>
          <DarkWebViolence />
        </Suspense>
      );
      break;
    case 'omen':
      page = (
        <Suspense fallback={<Fallback />}>
          <OmenChat />
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
