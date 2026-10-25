import { useEffect, useState } from 'react';
import { signal, useNow, useWakeLock } from '../components/hooks';
import { Icon } from '../components/Icon';
import { Ring } from '../components/Ring';
import { Chip, Modal, Stepper } from '../components/ui';
import { getExercise, isLoaded, TARGET_LABEL } from '../domain/exercises';
import { SAFETY_FLAGS } from '../domain/goals';
import type { ActiveSession, LoggedSet } from '../domain/types';
import { formatSeconds, formatWeight, fromDisplay, toDisplay, weightStep } from '../domain/units';
import { finishWorkout, logSet, suggestSet, undoLastSet } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { prescription } from './common';

const GET_READY_MS = 3000;

export function Player() {
  const { data, update } = useStore();
  const nav = useNav();
  const active = data.active!;
  const units = data.units;
  const i = Math.min(active.cursor, active.plan.length - 1);
  const planned = active.plan[i]!;
  const entry = active.entries[i]!;
  const done = entry.sets;
  const ex = getExercise(planned.exerciseId);
  const loaded = ex ? isLoaded(ex) : false;
  const isHold = ex?.type === 'hold';
  const isLastExercise = i === active.plan.length - 1;
  const exerciseDone = done.length >= planned.sets;

  const [draft, setDraft] = useState<LoggedSet>(() => suggestSet(planned, done, data.sessions));
  const [rest, setRest] = useState<{ endAt: number; total: number } | null>(null);
  const [hold, setHold] = useState<{ startAt: number; target: number } | null>(null);
  const [sheet, setSheet] = useState<null | 'exit' | 'pain'>(null);

  // Refill the editors whenever we move to another exercise or log/undo a set.
  useEffect(() => {
    setDraft(suggestSet(planned, done, data.sessions));
  }, [i, done.length]);

  useWakeLock(true);
  const now = useNow(rest !== null || hold !== null);
  const clock = useNow(true, 1000);

  const setActive = (fn: (a: ActiveSession) => ActiveSession) =>
    update((d) => (d.active ? { ...d, active: fn(d.active) } : d));

  const commit = (set: LoggedSet) => {
    setActive((a) => logSet(a, i, set));
    const finishesWorkout = isLastExercise && done.length + 1 >= planned.sets;
    if (!finishesWorkout && planned.restSec > 0) setRest({ endAt: Date.now() + planned.restSec * 1000, total: planned.restSec });
  };

  const weightPart = (): Pick<LoggedSet, 'weight'> =>
    loaded && draft.weight && draft.weight > 0 ? { weight: draft.weight } : {};

  const logReps = () => commit({ reps: Math.max(0, Math.round(draft.reps ?? 0)), ...weightPart() });
  const logHold = (seconds: number) => commit({ seconds: Math.max(0, Math.round(seconds)), ...weightPart() });

  // Timer completion is checked on each clock tick; clearing the timer state first prevents a second fire.
  useEffect(() => {
    if (hold && now - hold.startAt >= hold.target * 1000) {
      signal();
      setHold(null);
      logHold(hold.target);
    }
    if (rest && now >= rest.endAt) {
      signal();
      setRest(null);
    }
  }, [now]);

  const goTo = (idx: number) => setActive((a) => ({ ...a, cursor: Math.max(0, Math.min(a.plan.length - 1, idx)) }));

  const finish = (endedForPain: boolean) => {
    const session = finishWorkout(active, new Date(), endedForPain);
    update((d) => ({ ...d, active: null, sessions: session ? [...d.sessions, session] : d.sessions }));
    if (session) nav.replace({ name: 'summary', id: session.id });
    else nav.tab('today');
  };

  const totalSets = active.plan.reduce((n, p) => n + p.sets, 0);
  const loggedSets = active.entries.reduce((n, e) => n + e.sets.length, 0);
  const elapsed = (clock - Date.parse(active.startedAt)) / 1000;
  const describe = (s: LoggedSet) =>
    [
      s.seconds !== undefined ? formatSeconds(s.seconds) : null,
      s.reps !== undefined ? `${s.reps} reps` : null,
      s.weight ? formatWeight(s.weight, units) : null,
    ]
      .filter(Boolean)
      .join(' · ');
  const target = isHold ? `${planned.holdSec}s hold` : `${planned.reps} reps`;
  const rowCount = Math.max(planned.sets, done.length + (exerciseDone ? 0 : 1));

  return (
    <div className="player">
      <header className="player-head">
        <button type="button" className="icon-btn" onClick={() => setSheet('exit')} aria-label="Workout menu">
          <Icon name="x" />
        </button>
        <div className="player-progress">
          <span className="mono small">
            {i + 1} / {active.plan.length}
          </span>
          <div className="bar" role="progressbar" aria-label="Workout progress" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={loggedSets}>
            <span style={{ width: `${Math.min(100, (loggedSets / totalSets) * 100)}%` }} />
          </div>
        </div>
        <span className="mono small player-clock" aria-label="Elapsed time">
          {formatSeconds(elapsed)}
        </span>
      </header>

      <main className="player-main">
        <div className="chips">
          {ex?.targets.map((t) => (
            <Chip key={t}>{TARGET_LABEL[t]}</Chip>
          ))}
        </div>
        <h1 className="player-name">{ex?.name ?? planned.exerciseId}</h1>
        <p className="player-rx">
          <span className="mono">{prescription(planned)}</span>
          <span className="muted"> · rest {planned.restSec}s</span>
        </p>
        {ex && <p className="cue">{ex.cue}</p>}

        <ol className="sets" aria-label="Sets">
          {Array.from({ length: rowCount }, (_, k) => {
            const s = done[k];
            const current = k === done.length && !exerciseDone;
            return (
              <li key={k} className={`set ${s ? 'set-done' : ''} ${current ? 'set-current' : ''}`}>
                <span className="set-n">{k + 1}</span>
                <span className="set-val">{s ? describe(s) : current ? 'Now' : target}</span>
                {s && <Icon name="check" size={18} className="set-check" />}
              </li>
            );
          })}
        </ol>

        <div className="editors">
          {isHold ? (
            <Stepper label="Hold" value={draft.seconds ?? planned.holdSec ?? 30} min={1} max={600} step={5} suffix="s" onChange={(v) => setDraft({ ...draft, seconds: v })} />
          ) : (
            <Stepper label="Reps" value={draft.reps ?? planned.reps ?? 10} min={0} max={200} onChange={(v) => setDraft({ ...draft, reps: v })} />
          )}
          {loaded && (
            <Stepper
              label="Weight"
              value={toDisplay(draft.weight ?? 0, units)}
              step={weightStep(units)}
              max={1000}
              suffix={units}
              onChange={(v) => setDraft({ ...draft, weight: fromDisplay(v, units) })}
            />
          )}
        </div>

        <div className="stack-sm">
          {exerciseDone ? (
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() => (isLastExercise ? finish(false) : goTo(i + 1))}
            >
              {isLastExercise ? (
                <>
                  <Icon name="check" size={20} /> Finish workout
                </>
              ) : (
                <>
                  Next exercise <Icon name="right" size={20} />
                </>
              )}
            </button>
          ) : isHold ? (
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() => setHold({ startAt: Date.now() + GET_READY_MS, target: draft.seconds ?? planned.holdSec ?? 30 })}
            >
              <Icon name="timer" size={20} /> Start {draft.seconds ?? planned.holdSec}s hold
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={logReps}>
              <Icon name="check" size={20} /> Log set {done.length + 1}
            </button>
          )}
          <div className="btn-row">
            {exerciseDone && (
              <button type="button" className="btn btn-ghost btn-grow" onClick={() => (isHold ? logHold(draft.seconds ?? 0) : logReps())}>
                <Icon name="plus" size={16} /> Extra set
              </button>
            )}
            {!exerciseDone && isHold && (
              <button type="button" className="btn btn-ghost btn-grow" onClick={() => logHold(draft.seconds ?? 0)}>
                Log without timer
              </button>
            )}
            {done.length > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setActive((a) => undoLastSet(a, i))}>
                <Icon name="undo" size={16} /> Undo
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="player-foot">
        <button type="button" className="icon-btn" disabled={i === 0} onClick={() => goTo(i - 1)} aria-label="Previous exercise">
          <Icon name="left" />
        </button>
        <button type="button" className="pain-btn" onClick={() => setSheet('pain')}>
          <Icon name="alert" size={16} /> Pain? Stop
        </button>
        <button type="button" className="icon-btn" disabled={isLastExercise} onClick={() => goTo(i + 1)} aria-label="Next exercise">
          <Icon name="right" />
        </button>
      </footer>

      {hold && (
        <div className="overlay" role="timer" aria-live="off">
          {now < hold.startAt ? (
            <>
              <p className="eyebrow">Get ready</p>
              <Ring progress={1 - (hold.startAt - now) / GET_READY_MS} tone="accent">
                <span className="ring-big">{Math.ceil((hold.startAt - now) / 1000)}</span>
              </Ring>
              <p className="muted">{ex?.name}</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Hold</p>
              <Ring progress={(now - hold.startAt) / (hold.target * 1000)} tone="accent">
                <span className="ring-big">{Math.max(0, Math.ceil(hold.target - (now - hold.startAt) / 1000))}</span>
                <span className="muted small">of {hold.target}s</span>
              </Ring>
              <p className="muted">Let go early? Tap stop and we'll log what you held.</p>
            </>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setHold(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={now < hold.startAt}
              onClick={() => {
                const held = Math.min(hold.target, Math.round((Date.now() - hold.startAt) / 1000));
                setHold(null);
                // A sub-second "hold" is a mis-tap, not a set.
                if (held >= 1) logHold(held);
              }}
            >
              Stop & log
            </button>
          </div>
        </div>
      )}

      {rest && !hold && (
        <div className="overlay overlay-rest" role="timer" aria-live="off">
          <p className="eyebrow eyebrow-teal">Rest</p>
          <Ring progress={1 - (rest.endAt - now) / (rest.total * 1000)} tone="teal">
            <span className="ring-big">{formatSeconds((rest.endAt - now) / 1000)}</span>
          </Ring>
          <p className="muted">
            Up next:{' '}
            {exerciseDone ? (getExercise(active.plan[i + 1]?.exerciseId ?? '')?.name ?? 'finish') : `set ${done.length + 1} of ${planned.sets}`}
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setRest({ ...rest, endAt: rest.endAt + 15_000, total: rest.total + 15 })}>
              +15s
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setRest(null)}>
              Skip rest
            </button>
          </div>
        </div>
      )}

      {sheet === 'exit' && (
        <Modal
          title="Leave workout?"
          onClose={() => setSheet(null)}
          actions={
            <>
              <button type="button" className="btn btn-primary btn-block" disabled={loggedSets === 0} onClick={() => finish(false)}>
                Finish & save ({loggedSets} {loggedSets === 1 ? 'set' : 'sets'})
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => nav.back()}>
                Pause, resume later
              </button>
              <button
                type="button"
                className="btn btn-danger-ghost btn-block"
                onClick={() => {
                  update((d) => ({ ...d, active: null }));
                  nav.tab('today');
                }}
              >
                Discard workout
              </button>
            </>
          }
        />
      )}

      {sheet === 'pain' && (
        <Modal
          title="Stop if it hurts"
          tone="danger"
          onClose={() => setSheet(null)}
          actions={
            <>
              <button type="button" className="btn btn-danger btn-block" onClick={() => finish(true)}>
                End workout now
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setSheet(null)}>
                It's just effort, continue
              </button>
            </>
          }
        >
          <p>Muscle burn and fatigue are normal. These are not: stop and get checked by a professional.</p>
          <ul className="flags">
            {SAFETY_FLAGS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="muted small">Mild discomfort up to 3/10 that settles within 24 h is usually fine. Anything more: reduce the load.</p>
        </Modal>
      )}
    </div>
  );
}
