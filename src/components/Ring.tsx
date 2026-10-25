import type { ReactNode } from 'react';

/** Circular progress dial used by the hold and rest timers. */
export function Ring({ progress, tone, children }: { progress: number; tone: 'accent' | 'teal'; children: ReactNode }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={`ring-fill ring-${tone}`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
