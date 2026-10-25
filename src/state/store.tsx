import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadData, saveData } from '../domain/storage';
import type { AppData } from '../domain/types';

interface StoreValue {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  saveFailed: boolean;
}

const StoreCtx = createContext<StoreValue | null>(null);

/** localStorage, or an in-memory stand-in when it is blocked (private mode, sandboxed previews). */
function browserStore() {
  try {
    const ls = window.localStorage;
    const probe = '__ff_probe__';
    ls.setItem(probe, probe);
    ls.removeItem(probe);
    return ls;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(browserStore());
  const [data, setData] = useState<AppData>(() => loadData(storeRef.current));
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveData(storeRef.current, data));
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  const value = useMemo(() => ({ data, update, saveFailed }), [data, update, saveFailed]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
