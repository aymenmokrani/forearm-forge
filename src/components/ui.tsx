import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const id = useId();
  // +/- taps announce the new value once the tapping settles, not on every tap.
  const [said, setSaid] = useState('');
  const sayTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(sayTimer.current), []);
  const bump = (delta: number) => {
    const next = clamp(value + delta);
    onChange(next);
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setSaid(`${label.split(' · ').join(', ')} ${next}${suffix ? ` ${suffix}` : ''}`), 400);
  };

  return (
    <div className="stepper">
      <label id={`${id}-label`} htmlFor={`${id}-input`} className="stepper-label">
        {label}
      </label>
      <div className="stepper-row">
        <button type="button" className="round-btn" aria-label={`Decrease ${label}`} onClick={() => bump(-step)}>
          <Icon name="minus" />
        </button>
        <label className="stepper-value">
          <input
            id={`${id}-input`}
            inputMode="decimal"
            aria-labelledby={`${id}-label`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              const n = Number(text.replace(',', '.'));
              const next = Number.isFinite(n) && text.trim() !== '' ? clamp(n) : value;
              setText(String(next));
              if (next !== value) onChange(next);
            }}
            onFocus={(e) => e.target.select()}
          />
          {suffix && <span className="stepper-suffix">{suffix}</span>}
        </label>
        <button type="button" className="round-btn" aria-label={`Increase ${label}`} onClick={() => bump(step)}>
          <Icon name="plus" />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}

export function Modal({
  title,
  children,
  actions,
  onClose,
  tone = 'default',
}: {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  tone?: 'default' | 'danger';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  // Callers pass inline handlers; keep the latest without re-running the mount effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Focus the dialog itself: the first button is often the destructive one.
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      // Keep focus inside the dialog.
      const items = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), input, [href]')];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (document.activeElement === ref.current) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (prev?.isConnected) prev.focus();
    };
  }, []);

  return (
    <div className="scrim" onClick={onClose}>
      <div
        ref={ref}
        className={`sheet ${tone === 'danger' ? 'sheet-danger' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={children ? `${id}-body` : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={`${id}-title`} className="sheet-title">
          {title}
        </h2>
        {children && (
          <div id={`${id}-body`} className="sheet-body">
            {children}
          </div>
        )}
        <div className="sheet-actions">{actions}</div>
      </div>
    </div>
  );
}

export function RoundButton({ icon, label, onClick, disabled }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="round-btn" aria-label={label} onClick={onClick} disabled={disabled}>
      <Icon name={icon} />
    </button>
  );
}

/** The carved top block: lighter than the page, big bottom-right corner, coral glow top-right. */
export function Block({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return <header className={`block ${tall ? 'block-tall' : ''}`}>{children}</header>;
}

/** The one huge number of a screen, with its label beside it. */
export function Huge({
  value,
  label,
  sub,
  size,
  gold,
}: {
  value: ReactNode;
  label?: ReactNode;
  sub?: ReactNode;
  size?: number;
  gold?: boolean;
}) {
  return (
    <div className="huge">
      <span className={`huge-num ${gold ? 'huge-num-gold' : ''}`} style={size ? { fontSize: size } : undefined}>
        {value}
      </span>
      {(label || sub) && (
        <span className="huge-text">
          {label && <span className="huge-label">{label}</span>}
          {sub && <span className="huge-sub">{sub}</span>}
        </span>
      )}
    </div>
  );
}

/** Segmented progress: `filled` of `total` bars. */
export function Bars({ filled, total, tone = 'coral', label, pips }: { filled: number; total: number; tone?: 'coral' | 'peri'; label: string; pips?: boolean }) {
  return (
    <div className={`bars ${pips ? 'pips' : ''}`} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, k) => (
        <span key={k} className={k < filled ? `bar-${tone}` : ''} />
      ))}
    </div>
  );
}

export function StepDots({ index, count }: { index: number; count: number }) {
  return (
    <div className="steps-dots" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={count} aria-valuenow={index + 1} aria-valuetext={`Step ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, k) => (
        <span key={k} className={`${k <= index ? 'dot-on' : ''} ${k === index ? 'dot-now' : ''}`} />
      ))}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="card empty">
      <h2 className="card-title">{title}</h2>
      {children}
    </section>
  );
}
