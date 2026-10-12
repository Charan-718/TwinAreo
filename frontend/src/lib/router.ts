import { useEffect, useState } from 'react';

export type EnginePage = 'overview' | 'twin' | 'prognosis' | 'diagnostics' | 'drift' | 'scenarios' | 'advisor';
export type GlobalPage = 'fleet' | 'evaluation' | 'about';

export type Route =
  | { kind: 'global'; page: GlobalPage; anchor?: string }
  | { kind: 'engine'; page: EnginePage; engineId: number };

const ENGINE_PAGES: EnginePage[] = ['overview', 'twin', 'prognosis', 'diagnostics', 'drift', 'scenarios', 'advisor'];
const GLOBAL_PAGES: GlobalPage[] = ['fleet', 'evaluation', 'about'];

export function parseHash(hash: string): Route {
  const [path, anchor] = hash.replace(/^#\/?/, '').split('#');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'engines' && parts[1] && /^\d+$/.test(parts[1])) {
    const page = (ENGINE_PAGES as string[]).includes(parts[2]) ? (parts[2] as EnginePage) : 'overview';
    return { kind: 'engine', engineId: Number(parts[1]), page };
  }
  if ((GLOBAL_PAGES as string[]).includes(parts[0])) {
    return { kind: 'global', page: parts[0] as GlobalPage, anchor };
  }
  return { kind: 'global', page: 'fleet' };
}

export function href(route: Route): string {
  if (route.kind === 'engine') return `#/engines/${route.engineId}/${route.page}`;
  return `#/${route.page}${route.anchor ? `#${route.anchor}` : ''}`;
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
