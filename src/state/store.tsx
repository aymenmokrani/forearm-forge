import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { STORAGE_KEY, backupCorrupt, isNewerSchema, loadDataResult, parseData, saveData } from '../domain/storage';
import type { AppData } from '../domain/types';

interface StoreValue {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  saveFailed: boolean;
}

const StoreCtx = createContext<StoreValue | null>(null);

/**
 * localStorage, or an in-memory stand-in when it is blocked (private mode, sandboxed previews).
 * A failed probe write alone (quota full) keeps real storage so existing data still loads;
 * saves then report saveFailed.
 */
function browserStore() {
  try {
    const ls = window.localStorage;
    ls.getItem(STORAGE_KEY);
    try {
      const probe = '__ff_probe__';
      ls.setItem(probe, probe);
      ls.removeItem(probe);
    } catch {
      /* readable but not writable */
    }
    return ls;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(browserStore);
  const [initial] = useState(() => loadDataResult(store));
  const [data, setData] = useState<AppData>(initial.data);
  // Never overwrite data from a newer build, or an unreadable payload we failed to back up.
  const blocked = useRef<'newer' | 'unreadable' | null>(
    initial.status === 'newer' ? 'newer' : initial.status === 'unreadable' && !initial.backedUp ? 'unreadable' : null,
  );
  const [saveFailed, setSaveFailed] = useState(blocked.current !== null);
  // Only update() marks data dirty: loading or syncing from another tab never writes.
  const dirty = useRef(false);
  const persistAsked = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    if (blocked.current === 'unreadable' && initial.raw !== null && backupCorrupt(store, initial.raw)) blocked.current = null;
    setSaveFailed(blocked.current !== null || !saveData(store, data));
  }, [data, store, initial]);

  // Another tab saved: adopt its copy so this one doesn't write back a stale version.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      if (isNewerSchema(e.newValue)) {
        blocked.current = 'newer';
        setSaveFailed(true);
        return;
      }
      const next = parseData(e.newValue);
      if (!next) return;
      if (blocked.current) {
        // The payload we were protecting has been replaced by readable data.
        blocked.current = null;
        setSaveFailed(false);
      }
      dirty.current = false;
      setData(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Once there is real training data, ask the browser not to evict it.
  const onboarded = data.profile !== null;
  useEffect(() => {
    if (!onboarded || persistAsked.current) return;
    persistAsked.current = true;
    try {
      void navigator.storage?.persist?.()?.catch(() => {});
    } catch {
      /* unsupported */
    }
  }, [onboarded]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    dirty.current = true;
    setData(fn);
  }, []);
  const value = useMemo(() => ({ data, update, saveFailed }), [data, update, saveFailed]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
