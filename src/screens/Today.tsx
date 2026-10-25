import { useId, useState } from 'react';
import { Bars, Block, Huge, Modal } from '../components/ui';
import { getExercise } from '../domain/exercises';
import { dayName, nextDayIndex } from '../domain/generator';
import { GOAL_RULES } from '../domain/goals';
import { latestMeasurement, localDay, measurementDue } from '../domain/measure';
import { weeklyStreak, type Streak } from '../domain/streak';
import { isStale } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { dayMinutes, daysAgo, plural, prescription, useBeginWorkout } from './common';

function greeting(now: Date): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function streakLine({ weeks, thisWeek, target }: Streak, now: Date): string {
  if (thisWeek >= target) return `Target hit this week. Anything more is a bonus.`;
  const left = target - thisWeek;
  const daysLeft = 7 - ((now.getDay() + 6) % 7);
  if (left > daysLeft) return `${thisWeek} of ${target} this week. Next week is a fresh start.`;
  if (weeks === 0 && thisWeek === 0) return `Train ${target} days this week to start a streak.`;
  return `${thisWeek} of ${target} this week. ${left} more by Sunday ${weeks > 0 ? 'keeps it going' : 'starts a streak'}.`;
}

/** Valid forearm circumference in cm, or null. */
const parseCm = (text: string) => {
  const n = Number(text.replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(n) && n >= 10 && n <= 80 ? Math.round(n * 10) / 10 : null;
};

/** Every 2 weeks, before training: left and right forearm, prefilled from last time. */
function MeasureCard() {
  const { data, update } = useStore();
  const last = latestMeasurement(data.measurements);
  const [left, setLeft] = useState(last ? String(last.left) : '');
  const [right, setRight] = useState(last ? String(last.right) : '');
  const l = parseCm(left);
  const r = parseCm(right);
  const hintId = useId();

  return (
    <section className="card" aria-labelledby="measure-title">
      <div className="row-between">
        <div className="row-text">
          <span className="eyebrow">Every 2 weeks</span>
          <h2 id="measure-title" className="card-title">
            Forearm size
          </h2>
        </div>
        <button type="button" className="btn btn-text" onClick={() => update((d) => ({ ...d, measureSkippedOn: localDay(new Date()) }))}>
          Not today
        </button>
      </div>
      <p className="muted tiny">Measure the widest part, relaxed, before you train. A pump inflates it.</p>
      <span id={hintId} className="sr-only">
        10 to 80 cm
      </span>
      <div className="field-row">
        {(
          [
            ['Left', left, setLeft],
            ['Right', right, setRight],
          ] as const
        ).map(([side, value, set]) => (
          <label key={side} className="field">
            <span className="field-label">{side} · cm</span>
            <input
              inputMode="decimal"
              value={value}
              placeholder="0.0"
              aria-describedby={hintId}
              aria-invalid={value.trim() !== '' && parseCm(value) === null}
              onChange={(e) => set(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </label>
        ))}
        <button
          type="button"
          className="btn btn-primary btn-sm-primary"
          disabled={l === null || r === null}
          onClick={() =>
            l !== null && r !== null && update((d) => ({ ...d, measurements: [...d.measurements, { at: new Date().toISOString(), left: l, right: r }] }))
          }
        >
          Save
        </button>
      </div>
    </section>
  );
}

export function Today() {
  const { data, update } = useStore();
  const nav = useNav();
  const begin = useBeginWorkout();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const program = data.program!;
  const profile = data.profile!;
  const now = new Date();
  const nextIdx = nextDayIndex(program, data.sessions);
  const day = program.days[nextIdx] ?? program.days[0]!;
  const streak = weeklyStreak(data.sessions, profile.daysPerWeek, now);
  const active = data.active;
  const loggedSets = active?.entries.reduce((n, e) => n + e.sets.length, 0) ?? 0;
  const stale = active ? isStale(active) : false;

  return (
    <>
      <Block>
        <div className="row-text">
          <span className="muted small">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1 className="title-sm">{greeting(now)}</h1>
        </div>
        <Huge value={streak.weeks} label={streak.weeks === 1 ? 'week on target' : 'weeks on target'} sub="Weekly streak" />
        <Bars
          filled={Math.min(streak.thisWeek, streak.target)}
          total={streak.target}
          label={`${streak.thisWeek} of ${streak.target} workouts done this week`}
        />
        <p className="muted small">{streakLine(streak, now)}</p>
      </Block>

      <main className="content">
        {!active && measurementDue(data, now) && <MeasureCard />}

        {active ? (
          <section className="card">
            <div className="row-text">
              <span className="eyebrow">In progress</span>
              <h2 className="title-sm">{dayName(active.dayIndex)}</h2>
            </div>
            <p className="muted small">
              {plural(loggedSets, 'set')} logged · exercise {active.cursor + 1} of {active.plan.length}
            </p>
            {stale && (
              <p className="muted small">
                Paused since {daysAgo(active.lastSetAt ?? active.startedAt)}. Finish it to save those sets, or discard to start fresh.
              </p>
            )}
            <button type="button" className="btn btn-primary btn-block" onClick={() => nav.go({ name: 'player' })}>
              Resume workout
            </button>
            <button type="button" className="btn btn-text" onClick={() => setConfirmDiscard(true)}>
              Discard
            </button>
          </section>
        ) : (
          <section className="card">
            <div className="row-text">
              <span className="eyebrow">Next up</span>
              <h2 className="title-sm">
                {dayName(day.index)} · {GOAL_RULES[program.goal].label}
              </h2>
            </div>
            <div>
              {day.exercises.slice(0, 3).map((p) => (
                <button key={p.exerciseId} type="button" className="list-row" onClick={() => nav.go({ name: 'exercise', id: p.exerciseId })}>
                  <span className="row-name">{getExercise(p.exerciseId)?.name ?? p.exerciseId}</span>
                  <span className="muted small num">{prescription(p)}</span>
                </button>
              ))}
            </div>
            <span className="muted tiny">
              {day.exercises.length > 3 ? `+${day.exercises.length - 3} more · ` : ''}
              {plural(day.exercises.length, 'exercise')} · about {dayMinutes(day.exercises)} min
            </span>
            <button type="button" className="btn btn-primary btn-block" onClick={() => begin(nextIdx)}>
              Start workout
            </button>
            <button type="button" className="btn btn-text" onClick={() => nav.go({ name: 'warmup' })}>
              Warm up first · 3 min
            </button>
          </section>
        )}
      </main>

      {confirmDiscard && (
        <Modal
          title="Discard this workout?"
          tone="danger"
          onClose={() => setConfirmDiscard(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDiscard(false)}>
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-safety"
                onClick={() => {
                  update((d) => ({ ...d, active: null }));
                  setConfirmDiscard(false);
                }}
              >
                Discard
              </button>
            </>
          }
        >
          The {plural(loggedSets, 'logged set')} will be lost.
        </Modal>
      )}
    </>
  );
}
