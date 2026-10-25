import { useEffect, useState } from 'react';
import { sfx } from './sound';

/** Ticks a clock while `running`. Timers derive from Date.now() so backgrounding the tab can't drift them. */
export function useNow(running: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [running, intervalMs]);
  return now;
}

/** Keeps the screen awake during a workout where supported; re-acquires after tab switches. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock?.release();
      } catch {
        /* denied or unsupported: fine */
      }
    };
    void acquire();
    const onVis = () => document.visibilityState === 'visible' && void acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release().catch(() => {});
    };
  }, [enabled]);
}

/** Timer finished: rising three-note chime (if sounds are on) and three short vibrations. */
export function signal() {
  try {
    navigator.vibrate?.([90, 70, 90, 70, 90]);
  } catch {
    /* ignore */
  }
  sfx.timerDone();
}
