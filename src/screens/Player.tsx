import { useEffect, useRef, useState } from 'react';
import { signal, useNow, useWakeLock } from '../components/hooks';
import { Icon } from '../components/Icon';
import { sfx } from '../components/sound';
import { Bars, Block, Modal, RoundButton, Stepper } from '../components/ui';
import { getExercise, isLoaded } from '../domain/exercises';
import { SAFETY_FLAGS } from '../domain/goals';
import { buildLadder, CLOSE_EXERCISES, CLOSES_TO_CLAIM, getGripper, GRIPPERS, lastGripper } from '../domain/ladder';
import { CLOSES, type ActiveSession, type Close, type LoggedSet, type Session } from '../domain/types';
import { formatSeconds, formatWeight, fromDisplay, toDisplay, weightStep } from '../domain/units';
import { finishWorkout, logSet, suggestSet, undoLastSet } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { plural, prescription } from './common';

const GET_READY_MS = 3000;

const CLOSE_LABEL: Record<Close, string> = { full: 'Full close', almost: 'Almost', no: 'No' };

/** Elapsed workout time as m:ss. */
const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

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
  const closes = CLOSE_EXERCISES.has(planned.exerciseId);
  const isLastExercise = i === active.plan.length - 1;
  const exerciseDone = done.length >= planned.sets;

  // The workout so far counts toward the ladder as if it were already saved.
  const soFar: Session = { id: active.id, dayIndex: active.dayIndex, startedAt: active.startedAt, finishedAt: new Date().toISOString(), entries: active.entries };
  const ladder = buildLadder([...data.sessions, soFar]);

  const suggest = (): LoggedSet => {
    const s = suggestSet(planned, done, data.sessions);
    if (!closes) return s;
    // Ask how every close went; never carry the last answer over.
    return { ...s, gripper: s.gripper ?? lastGripper(data.sessions, planned.exerciseId) ?? ladder.next?.id ?? 'sport', close: undefined };
  };

  const [draft, setDraft] = useState<LoggedSet>(suggest);
  const [rest, setRest] = useState<{ endAt: number; total: number } | null>(null);
  const [hold, setHold] = useState<{ startAt: number; target: number } | null>(null);
  const [sheet, setSheet] = useState<null | 'menu' | 'pain'>(null);

  // Refill the editors whenever we move to another exercise or log/undo a set.
  useEffect(() => {
    setDraft(suggest());
  }, [i, done.length]);

  useWakeLock(true);
  const now = useNow(rest !== null || hold !== null);
  const tick = useNow(true, 1000);

  const setActive = (fn: (a: ActiveSession) => ActiveSession) => update((d) => (d.active ? { ...d, active: fn(d.active) } : d));

  /** `quiet` when the timer chime already marks the moment. */
  const commit = (set: LoggedSet, quiet = false) => {
    setActive((a) => logSet(a, i, set));
    if (!quiet) sfx.setLogged();
    const finishesWorkout = isLastExercise && done.length + 1 >= planned.sets;
    if (!finishesWorkout && planned.restSec > 0) setRest({ endAt: Date.now() + planned.restSec * 1000, total: planned.restSec });
  };

  const extras = (): LoggedSet => ({
    ...(loaded && draft.weight && draft.weight > 0 ? { weight: draft.weight } : {}),
    ...(closes && draft.gripper && draft.close ? { gripper: draft.gripper, close: draft.close } : {}),
  });

  const logReps = () => commit({ reps: Math.max(0, Math.round(draft.reps ?? 0)), ...extras() });
  const logHold = (seconds: number, quiet = false) => commit({ seconds: Math.max(0, Math.round(seconds)), ...extras() }, quiet);

  // Timer completion is checked on each clock tick; clearing the timer state first prevents a second fire.
  useEffect(() => {
    if (hold && now - hold.startAt >= hold.target * 1000) {
      signal();
      setHold(null);
      logHold(hold.target, true);
    }
    if (rest && now >= rest.endAt) {
      signal();
      setRest(null);
    }
  }, [now]);

  // Ticks: every second of a hold, firmer for the 3-2-1 get-ready and the last 3 seconds.
  // Rest stays quiet until its last 3 seconds. Each beat plays once.
  const lastBeat = useRef<string | null>(null);
  useEffect(() => {
    let beat: string | null = null;
    let firm = false;
    if (hold) {
      if (now < hold.startAt) {
        beat = `ready${Math.ceil((hold.startAt - now) / 1000)}`;
        firm = true;
      } else {
        const elapsed = Math.floor((now - hold.startAt) / 1000);
        const left = hold.target - elapsed;
        if (elapsed > 0 && left > 0) {
          beat = `hold${elapsed}`;
          firm = left <= 3;
        }
      }
    } else if (rest) {
      const left = Math.ceil((rest.endAt - now) / 1000);
      if (left > 0 && left <= 3) {
        beat = `rest${left}`;
        firm = true;
      }
    }
    if (beat && beat !== lastBeat.current) (firm ? sfx.lastTick : sfx.tick)();
    lastBeat.current = beat;
  }, [now, hold, rest]);

  const goTo = (idx: number) => {
    setSheet(null);
    setActive((a) => ({ ...a, cursor: Math.max(0, Math.min(a.plan.length - 1, idx)) }));
  };

  const finish = (endedForPain: boolean) => {
    const session = finishWorkout(active, new Date(), endedForPain);
    update((d) => ({ ...d, active: null, sessions: session ? [...d.sessions, session] : d.sessions }));
    if (session) nav.replace({ name: 'summary', id: session.id });
    else nav.tab('today');
  };

  const loggedSets = active.entries.reduce((n, e) => n + e.sets.length, 0);
  const describe = (s: LoggedSet) =>
    [
      s.seconds !== undefined ? formatSeconds(s.seconds) : null,
      s.reps !== undefined ? `${s.reps} reps` : null,
      s.weight ? formatWeight(s.weight, units) : null,
      s.gripper ? getGripper(s.gripper).name : null,
      s.close ? CLOSE_LABEL[s.close] : null,
    ]
      .filter(Boolean)
      .join(' · ');
  const target = isHold ? `${planned.holdSec} s hold` : `${planned.reps} reps`;
  const rowCount = Math.max(planned.sets, done.length + (exerciseDone ? 0 : 1));
  const needsClose = closes && !draft.close;

  // Ladder note for the chosen gripper, counting this set if it is logged as a full close.
  const rung = closes && draft.gripper ? ladder.rungs.find((r) => r.id === draft.gripper) : undefined;
  const alreadyToday = active.entries.some((e) => e.sets.some((s) => s.gripper === draft.gripper && s.close === 'full'));
  const rungCount = rung ? Math.min(CLOSES_TO_CLAIM, rung.sessions + (draft.close === 'full' && !alreadyToday ? 1 : 0)) : 0;

  return (
    <>
      <Block>
        <div className="row-between">
          <RoundButton icon="close" label="Workout menu" onClick={() => setSheet('menu')} />
          <span className="muted small">
            Exercise {i + 1} of {active.plan.length}
          </span>
          <span className="num" style={{ minWidth: 44, textAlign: 'right', fontSize: 17 }} aria-label="Elapsed time">
            {clock((tick - Date.parse(active.startedAt)) / 1000)}
          </span>
        </div>
        <div className="row-between" style={{ alignItems: 'flex-end' }}>
          <div className="row-text" style={{ gap: 8, paddingBottom: 4 }}>
            <h1 className="title" style={{ fontSize: 28 }}>
              {ex?.name ?? planned.exerciseId}
            </h1>
            <span className="muted">
              {prescription(planned)} · rest {planned.restSec} s
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flex: 'none' }}>
            <span className="huge-num">{exerciseDone ? done.length : done.length + 1}</span>
            <span className="tiny soft-coral" style={{ fontWeight: 600 }}>
              {exerciseDone ? 'sets done' : `set of ${planned.sets}`}
            </span>
          </div>
        </div>
      </Block>

      <main className="content" style={{ gap: 10 }}>
        {ex && (
          <section className="card" style={{ padding: '14px 18px' }}>
            <p className="muted">{ex.cue}</p>
          </section>
        )}

        <ol className="card sets" aria-label="Sets">
          {Array.from({ length: rowCount }, (_, k) => {
            const s = done[k];
            const current = k === done.length && !exerciseDone;
            return (
              <li key={k} className={`set ${s ? 'set-done' : ''} ${current ? 'set-current' : ''}`}>
                <span className="set-n">{k + 1}</span>
                <span className="grow">{s ? describe(s) : current ? 'Now' : target}</span>
                {s && (
                  <span className="mint" aria-label="Done">
                    <Icon name="check" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {closes && !exerciseDone ? (
          <>
            <section className="card" style={{ padding: '14px 14px 14px 18px', gap: 10 }}>
              <span className="small muted" style={{ fontWeight: 600 }}>
                Which gripper?
              </span>
              <div className="chip-row" role="radiogroup" aria-label="Gripper">
                {GRIPPERS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.gripper === g.id}
                    className={`chip ${draft.gripper === g.id ? 'chip-on' : ''}`}
                    onClick={() => setDraft({ ...draft, gripper: g.id })}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </section>
            <section className="card" style={{ padding: '14px 14px 14px 18px', gap: 10 }}>
              <span className="small muted" style={{ fontWeight: 600 }}>
                Did the handles touch?
              </span>
              <div className="chip-fill" role="radiogroup" aria-label="Did the handles touch?">
                {CLOSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={draft.close === c}
                    className={`chip ${draft.close === c ? 'chip-on' : ''}`}
                    onClick={() => setDraft({ ...draft, close: c })}
                  >
                    {CLOSE_LABEL[c]}
                  </button>
                ))}
              </div>
            </section>
            <section className="card" style={{ padding: '12px 14px 12px 18px' }}>
              <Stepper label="Reps" value={draft.reps ?? planned.reps ?? 5} min={0} max={200} onChange={(v) => setDraft({ ...draft, reps: v })} />
            </section>
            {rung && (
              <section className="card card-quiet" style={{ padding: '12px 18px' }}>
                <div className="row-between">
                  <div className="row-text">
                    <span className="muted tiny">{draft.close === 'full' ? 'This close counts on your ladder' : 'Full closes count on your ladder'}</span>
                    <span className="num">
                      {rung.name} · {rung.claimed ? 'claimed' : `${rungCount} of ${CLOSES_TO_CLAIM}`}
                    </span>
                  </div>
                  <Bars filled={rung.claimed ? CLOSES_TO_CLAIM : rungCount} total={CLOSES_TO_CLAIM} tone="peri" pips label={`${rungCount} of ${CLOSES_TO_CLAIM} full closes`} />
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="card" style={{ padding: '14px 18px' }}>
            <div className="steppers">
              {isHold ? (
                <Stepper label="Hold · s" value={draft.seconds ?? planned.holdSec ?? 30} min={1} max={600} step={5} onChange={(v) => setDraft({ ...draft, seconds: v })} />
              ) : (
                <Stepper label="Reps" value={draft.reps ?? planned.reps ?? 10} min={0} max={200} onChange={(v) => setDraft({ ...draft, reps: v })} />
              )}
              {loaded && (
                <Stepper
                  label={`Weight · ${units}`}
                  value={toDisplay(draft.weight ?? 0, units)}
                  step={weightStep(units)}
                  max={1000}
                  onChange={(v) => setDraft({ ...draft, weight: fromDisplay(v, units) })}
                />
              )}
            </div>
          </section>
        )}

        <div className="stack push-down" style={{ paddingTop: 6 }}>
          {exerciseDone ? (
            <button type="button" className="btn btn-primary btn-block" onClick={() => (isLastExercise ? finish(false) : goTo(i + 1))}>
              {isLastExercise ? 'Finish workout' : 'Next exercise'}
            </button>
          ) : isHold ? (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setHold({ startAt: Date.now() + GET_READY_MS, target: draft.seconds ?? planned.holdSec ?? 30 })}
            >
              Start {draft.seconds ?? planned.holdSec} s hold
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" disabled={needsClose} onClick={logReps}>
              {needsClose ? 'Pick how the close went' : `Log set ${done.length + 1}`}
            </button>
          )}
          {(done.length > 0 || exerciseDone || (isHold && !exerciseDone)) && (
            <div className="row" style={{ justifyContent: 'center', gap: 4 }}>
              {exerciseDone && (
                <button type="button" className="btn btn-text" disabled={needsClose} onClick={() => (isHold ? logHold(draft.seconds ?? 0) : logReps())}>
                  Extra set
                </button>
              )}
              {!exerciseDone && isHold && (
                <button type="button" className="btn btn-text" onClick={() => logHold(draft.seconds ?? 0)}>
                  Log without timer
                </button>
              )}
              {done.length > 0 && (
                <button type="button" className="btn btn-text" onClick={() => setActive((a) => undoLastSet(a, i))}>
                  Undo last set
                </button>
              )}
            </div>
          )}
          <button type="button" className="btn btn-safety btn-block" onClick={() => setSheet('pain')}>
            Pain? Stop
          </button>
        </div>
      </main>

      {hold && (
        <div className="timer-screen" role="timer" aria-live="off">
          <div className="app">
            <Block tall>
              <div className="row-between">
                <RoundButton icon="close" label="Cancel hold" onClick={() => setHold(null)} />
                <span className="muted small">
                  Set {done.length + 1} of {planned.sets}
                </span>
                <span style={{ width: 44 }} />
              </div>
              <div className="row-text" style={{ paddingTop: 8 }}>
                <span className="eyebrow">{now < hold.startAt ? 'Get ready' : 'Hold'}</span>
                <h1 className="title">{ex?.name}</h1>
              </div>
              <div className="huge" style={{ paddingTop: 8 }}>
                <span className="huge-num huge-num-xl">
                  {now < hold.startAt ? Math.ceil((hold.startAt - now) / 1000) : Math.min(hold.target, Math.floor((now - hold.startAt) / 1000))}
                </span>
                <span className="huge-text">
                  <span className="huge-label muted">
                    {now < hold.startAt ? (
                      'seconds'
                    ) : (
                      <>
                        of {hold.target}
                        <br />
                        seconds
                      </>
                    )}
                  </span>
                </span>
              </div>
              <div
                className="meter"
                role="progressbar"
                aria-label="Hold time"
                aria-valuemin={0}
                aria-valuemax={hold.target}
                aria-valuenow={Math.max(0, Math.floor((now - hold.startAt) / 1000))}
              >
                <span style={{ width: `${now < hold.startAt ? 0 : Math.min(100, ((now - hold.startAt) / (hold.target * 1000)) * 100)}%` }} />
              </div>
            </Block>
            <main className="content">
              {ex && (
                <section className="card">
                  <p className="muted">{ex.cue}</p>
                </section>
              )}
              {done.length > 0 && (
                <section className="card card-quiet" style={{ padding: '6px 18px' }}>
                  {done.map((s, k) => (
                    <div key={k} className="list-row">
                      <span className="muted small">Set {k + 1}</span>
                      <span className="row num" style={{ gap: 8 }}>
                        {describe(s)}
                        <span className="mint">
                          <Icon name="check" size={18} />
                        </span>
                      </span>
                    </div>
                  ))}
                </section>
              )}
              <p className="muted small center">Let go early? Tap stop and the time you held is logged.</p>
              <div className="btn-pair push-down">
                <button type="button" className="btn btn-secondary" style={{ minHeight: 58 }} onClick={() => setHold(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.6 }}
                  disabled={now < hold.startAt}
                  onClick={() => {
                    const held = Math.min(hold.target, Math.round((Date.now() - hold.startAt) / 1000));
                    setHold(null);
                    // A sub-second "hold" is a mis-tap, not a set.
                    if (held >= 1) logHold(held);
                  }}
                >
                  Stop and log
                </button>
              </div>
            </main>
          </div>
        </div>
      )}

      {rest && !hold && (
        <div className="timer-screen" role="timer" aria-live="off">
          <div className="app">
            <Block tall>
              <div className="row-between">
                <RoundButton icon="close" label="Skip rest" onClick={() => setRest(null)} />
                <span className="muted small">
                  {plural(loggedSets, 'set')} logged
                </span>
                <span style={{ width: 44 }} />
              </div>
              <div className="row-text" style={{ paddingTop: 8 }}>
                <span className="eyebrow">Rest</span>
                <h1 className="title">Breathe. Shake it out.</h1>
              </div>
              <div className="huge" style={{ paddingTop: 8 }}>
                <span className="huge-num huge-num-xl">{Math.max(0, Math.ceil((rest.endAt - now) / 1000))}</span>
                <span className="huge-text">
                  <span className="huge-label muted">
                    seconds
                    <br />
                    left
                  </span>
                </span>
              </div>
              <div className="meter" role="progressbar" aria-label="Rest left" aria-valuemin={0} aria-valuemax={rest.total} aria-valuenow={Math.max(0, Math.ceil((rest.endAt - now) / 1000))}>
                <span style={{ width: `${Math.min(100, Math.max(0, ((rest.endAt - now) / (rest.total * 1000)) * 100))}%` }} />
              </div>
            </Block>
            <main className="content">
              <section className="card">
                <span className="eyebrow">Up next</span>
                <h2 className="card-title">
                  {exerciseDone ? (getExercise(active.plan[i + 1]?.exerciseId ?? '')?.name ?? 'Finish') : `${ex?.name ?? 'Set'} · set ${done.length + 1} of ${planned.sets}`}
                </h2>
              </section>
              <div className="btn-pair push-down">
                <button type="button" className="btn btn-secondary" style={{ minHeight: 58 }} onClick={() => setRest({ ...rest, endAt: rest.endAt + 15_000, total: rest.total + 15 })}>
                  +15 s
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1.6 }} onClick={() => setRest(null)}>
                  Skip rest
                </button>
              </div>
            </main>
          </div>
        </div>
      )}

      {sheet === 'menu' && (
        <Modal
          title="Workout"
          onClose={() => setSheet(null)}
          actions={
            <>
              <button type="button" className="btn btn-primary btn-block" disabled={loggedSets === 0} onClick={() => finish(false)}>
                Finish and save ({plural(loggedSets, 'set')})
              </button>
              {!isLastExercise && (
                <button type="button" className="btn btn-secondary btn-block" onClick={() => goTo(i + 1)}>
                  Skip to next exercise
                </button>
              )}
              {i > 0 && (
                <button type="button" className="btn btn-secondary btn-block" onClick={() => goTo(i - 1)}>
                  Back to previous exercise
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-block" onClick={() => nav.back()}>
                Pause, resume later
              </button>
              <button
                type="button"
                className="btn btn-safety btn-block"
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
              <button type="button" className="btn btn-safety btn-block" onClick={() => finish(true)}>
                End workout now
              </button>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet(null)}>
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
          <p className="tiny">Mild discomfort up to 3/10 that settles within 24 h is usually fine. Anything more: reduce the load.</p>
        </Modal>
      )}
    </>
  );
}
