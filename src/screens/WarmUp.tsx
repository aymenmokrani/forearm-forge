import { useEffect, useRef, useState } from 'react';
import { signal, useNow, useWakeLock } from '../components/hooks';
import { Icon } from '../components/Icon';
import { sfx } from '../components/sound';
import { Block, Huge, RoundButton } from '../components/ui';
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

  // Click on the last 3 seconds of each move; the chime marks the switch.
  const lastBeat = useRef<string | null>(null);
  useEffect(() => {
    const left = endAt === null ? 0 : Math.ceil((endAt - now) / 1000);
    const beat = left > 0 && left <= 3 ? `${step}-${left}` : null;
    if (beat && beat !== lastBeat.current) sfx.lastTick();
    lastBeat.current = beat;
  }, [now, endAt, step]);

  const startWorkout = () => begin(data.program ? nextDayIndex(data.program, data.sessions) : 0, 'replace');
  const left = current ? (endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : current.seconds) : 0;

  return (
    <div className="app">
      <Block tall>
        <div className="row-between">
          <RoundButton icon="back" label="Back" onClick={nav.back} />
          <span className="muted small">{finished ? 'Warm-up done' : `Step ${step + 1} of ${WARM_UP.length}`}</span>
          <span style={{ width: 44 }} />
        </div>
        {!finished && current ? (
          <>
            <div className="row-text">
              <span className="eyebrow">Warm-up</span>
              <h1 className="title">{current.name}</h1>
            </div>
            <Huge value={left} label="seconds" sub={current.cue} size={120} />
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${endAt ? Math.min(100, (1 - (endAt - now) / (current.seconds * 1000)) * 100) : 0}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="row-text">
              <span className="eyebrow">Warmed up</span>
              <h1 className="title">Ready to work.</h1>
            </div>
            <Huge value={WARM_UP.length} label="moves done" sub="Do 1-2 easy ramp-up sets at about 50% before your first loaded exercise." />
          </>
        )}
      </Block>

      <main className="content">
        <section className="card" style={{ padding: '6px 18px', gap: 0 }}>
          {WARM_UP.map((w, k) => (
            <div key={w.name} className="list-row">
              <span className={`small ${k === step ? 'soft-coral' : k < step ? '' : 'muted'}`} style={{ fontWeight: k === step ? 600 : 400 }}>
                {w.name}
              </span>
              {k < step ? (
                <span className="mint" role="img" aria-label="Done">
                  <Icon name="check" size={18} />
                </span>
              ) : (
                <span className="muted tiny num">{w.seconds} s</span>
              )}
            </div>
          ))}
        </section>

        <div className="stack push-down">
          {!finished && current && endAt === null && (
            <button type="button" className="btn btn-primary btn-block" onClick={() => setEndAt(Date.now() + current.seconds * 1000)}>
              {step === 0 ? 'Start warm-up' : 'Continue'}
            </button>
          )}
          {!finished && endAt !== null && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setEndAt(Date.now())}>
              Next move
            </button>
          )}
          <button type="button" className={`btn btn-block ${finished ? 'btn-primary' : 'btn-text'}`} onClick={startWorkout}>
            {finished ? 'Start workout' : 'Skip to workout'}
          </button>
        </div>
      </main>
    </div>
  );
}
