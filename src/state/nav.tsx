import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type Tab = 'today' | 'plan' | 'library' | 'history' | 'me';

export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'player' }
  | { name: 'warmup' }
  | { name: 'summary'; id: string }
  | { name: 'exercise'; id: string }
  | { name: 'session'; id: string }
  | { name: 'setup' };

interface NavValue {
  route: Route;
  /** Switch tabs; clears any pushed screens. */
  tab: (tab: Tab) => void;
  /** Push a screen; the browser/Android back button pops it. */
  go: (route: Route) => void;
  /** Swap the current screen without growing history. */
  replace: (route: Route) => void;
  back: () => void;
}

const NavCtx = createContext<NavValue | null>(null);

/** Stack position stored on each history entry, so popstate knows where it landed. */
const depthOf = (state: unknown) =>
  typeof state === 'object' && state !== null && typeof (state as { ffDepth?: unknown }).ffDepth === 'number'
    ? (state as { ffDepth: number }).ffDepth
    : 0;

/**
 * Screen stack mirrored onto browser history: entry k carries { ffDepth: k }, and the
 * stack length always equals the current entry's depth + 1. Back/forward simply
 * truncate to (or correct back to) that depth.
 */
export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'tab', tab: 'today' }]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  useEffect(() => {
    // A reload starts a fresh stack; make the current entry its root.
    window.history.replaceState({ ffDepth: 0 }, '');
    const onPop = (e: PopStateEvent) => {
      const depth = depthOf(e.state);
      const len = stackRef.current.length;
      if (depth < len) setStack((s) => s.slice(0, depth + 1));
      // Forward into a screen we no longer have: step back to where we are.
      else if (depth > len - 1) window.history.go(len - 1 - depth);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const route = stack[stack.length - 1]!;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const go = useCallback((r: Route) => {
    window.history.pushState({ ffDepth: stackRef.current.length }, '');
    setStack((s) => [...s, r]);
  }, []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const tab = useCallback((t: Tab) => {
    const extra = stackRef.current.length - 1;
    setStack([{ name: 'tab', tab: t }]);
    // Unwind the pushed entries; the resulting popstate lands on depth 0, which is a no-op.
    if (extra > 0) window.history.go(-extra);
  }, []);
  const back = useCallback(() => {
    if (stackRef.current.length > 1) window.history.back();
  }, []);

  const value = useMemo(() => ({ route, tab, go, replace, back }), [route, tab, go, replace, back]);
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav(): NavValue {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>');
  return ctx;
}
