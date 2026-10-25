import { useEffect, useState } from 'react';
import { signal, useNow, useWakeLock } from '../components/hooks';
import { Icon } from '../components/Icon';
import { Ring } from '../components/Ring';
import { TopBar } from '../components/ui';
import { nextDayIndex } from '../domain/generator';
import { WARM_UP } from '../domain/goals';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { useBeginWorkout } from './common';

export function WarmUp() {
  const { data } = useStore();
  const nav = useNav();
  const begin = useBeginWorkout();
  const [step, setStep] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);
  const now = useNow(endAt !== null);
  useWakeLock(true);

  const current = WARM_UP[step];
  const finished = step >= WARM_UP.length;

  useEffect(() => {
    if (endAt === null || now < endAt) return;
    signal();
    const nextStep = step + 1;
    setStep(nextStep);
    setEndAt(nextStep < WARM_UP.length ? Date.now() + WARM_UP[nextStep]!.seconds * 1000 : null);
  }, [now, endAt, step]);

  const startWorkout = () => begin(data.program ? nextDayIndex(data.program, data.sessions) : 0, 'replace');

  return (
    <div className="app">
      <TopBar title="Warm-up" onBack={nav.back} />
      <main className="screen screen-pad-bottom">
        {!finished && current ? (
          <section className="warm-now">
            <p className="eyebrow">
              Step {step + 1} of {WARM_UP.length}
            </p>
            <Ring progress={endAt ? 1 - (endAt - now) / (current.seconds * 1000) : 0} tone="teal">
              <span className="ring-big">{endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : current.seconds}</span>
              <span className="muted small">seconds</span>
            </Ring>
            <h1 className="player-name center">{current.name}</h1>
            <p className="cue center">{current.cue}</p>
            {endAt === null ? (
              <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setEndAt(Date.now() + current.seconds * 1000)}>
                <Icon name="play" size={20} /> {step === 0 ? 'Start warm-up' : 'Continue'}
              </button>
            ) : (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setEndAt(Date.now())}>
                Next step
              </button>
            )}
          </section>
        ) : (
          <section className="warm-now">
            <p className="eyebrow eyebrow-teal">Warmed up</p>
            <h1 className="display-sm center">Ready to work.</h1>
            <p className="muted center">Do 1-2 easy ramp-up sets at ~50% before your first loaded exercise.</p>
          </section>
        )}

        <ol className="warm-list">
          {WARM_UP.map((w, k) => (
            <li key={w.name} className={k < step ? 'warm-done' : k === step ? 'warm-current' : ''}>
              <span>{w.name}</span>
              <span className="mono">{w.seconds}s</span>
            </li>
          ))}
        </ol>

        <button type="button" className={`btn btn-block ${finished ? 'btn-primary btn-lg' : 'btn-ghost'}`} onClick={startWorkout}>
          {finished ? 'Start workout' : 'Skip to workout'} <Icon name="right" size={18} />
        </button>
      </main>
    </div>
  );
}
