import { useEffect, useState } from 'react';

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

let audioCtx: AudioContext | null = null;

/** Timer finished: a rising three-note chime and three short vibrations. Web audio follows the silent switch on iOS. */
export function signal() {
  try {
    navigator.vibrate?.([90, 70, 90, 70, 90]);
  } catch {
    /* ignore */
  }
  try {
    audioCtx ??= new AudioContext();
    const t0 = audioCtx.currentTime;
    [660, 880, 1175].forEach((freq, k) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      const at = t0 + k * 0.13;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(at);
      osc.stop(at + 0.32);
    });
  } catch {
    /* audio unavailable */
  }
}
