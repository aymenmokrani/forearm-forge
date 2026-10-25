import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Chip, Modal } from '../components/ui';
import { getExercise, TARGET_LABEL } from '../domain/exercises';
import { dayName, nextDayIndex } from '../domain/generator';
import { GOAL_RULES } from '../domain/goals';
import { isStale } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { currentWeek, daysAgo, prescription, sameDay, useBeginWorkout } from './common';

export function Today() {
  const { data, update } = useStore();
  const nav = useNav();
  const begin = useBeginWorkout();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const program = data.program!;
  const profile = data.profile!;
  const nextIdx = nextDayIndex(program, data.sessions);
  const day = program.days[nextIdx] ?? program.days[0]!;
  const week = currentWeek();
  const doneThisWeek = data.sessions.filter((s) => week.some((d) => sameDay(d, new Date(s.finishedAt))));
  const last = [...data.sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const minutes = Math.round(
    day.exercises.reduce((t, p) => t + p.sets * ((p.holdSec ?? (p.reps ?? 10) * 3) + p.restSec), 0) / 60,
  );
  const active = data.active;
  const loggedSets = active?.entries.reduce((n, e) => n + e.sets.length, 0) ?? 0;
  const stale = active ? isStale(active) : false;

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="display-sm">Today</h1>
      </header>

      <section className="card week" aria-label="This week">
        <div className="row-between">
          <span className="label">This week</span>
          <span className="week-count">
            <strong>{doneThisWeek.length}</strong> / {profile.daysPerWeek}
          </span>
        </div>
        <ol className="week-strip">
          {week.map((d) => {
            const done = doneThisWeek.some((s) => sameDay(d, new Date(s.finishedAt)));
            const today = sameDay(d, new Date());
            return (
              <li key={d.toISOString()} className={`${done ? 'wk-done' : ''} ${today ? 'wk-today' : ''}`}>
                <span>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                <i aria-label={done ? 'trained' : 'rest'} />
              </li>
            );
          })}
        </ol>
      </section>

      {active ? (
        <section className="card hero hero-live">
          <p className="eyebrow eyebrow-teal">In progress</p>
          <h2 className="hero-title">{dayName(active.dayIndex)}</h2>
          <p className="muted">
            {loggedSets} {loggedSets === 1 ? 'set' : 'sets'} logged · exercise {active.cursor + 1} of {active.plan.length}
          </p>
          {stale && (
            <p className="note-inline">
              <Icon name="timer" size={16} /> Paused since {daysAgo(active.lastSetAt ?? active.startedAt)}. Finish it to save
              those sets, or discard to start fresh.
            </p>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-grow" onClick={() => nav.go({ name: 'player' })}>
              <Icon name="play" size={18} /> Resume
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDiscard(true)}>
              Discard
            </button>
          </div>
        </section>
      ) : (
        <section className="card hero">
          <div className="row-between">
            <p className="eyebrow">Next up</p>
            <Chip tone="accent">{GOAL_RULES[program.goal].label}</Chip>
          </div>
          <h2 className="hero-title">{dayName(day.index)}</h2>
          <div className="chips">
            {day.focus.slice(0, 4).map((t) => (
              <Chip key={t}>{TARGET_LABEL[t]}</Chip>
            ))}
          </div>
          <ol className="hero-list">
            {day.exercises.map((p) => (
              <li key={p.exerciseId}>
                <button type="button" className="link-row" onClick={() => nav.go({ name: 'exercise', id: p.exerciseId })}>
                  <span>{getExercise(p.exerciseId)?.name ?? p.exerciseId}</span>
                  <span className="mono">{prescription(p)}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="muted small">
            About {minutes} min · rest {day.exercises[0]?.restSec ?? 60}s between sets
          </p>
          <div className="stack-sm">
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => begin(nextIdx)}>
              <Icon name="play" size={20} /> Start workout
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => nav.go({ name: 'warmup' })}>
              <Icon name="flame" size={18} /> Warm up first (3 min)
            </button>
          </div>
        </section>
      )}

      {last && (
        <button type="button" className="card last-card" onClick={() => nav.go({ name: 'session', id: last.id })}>
          <span className="label">Last session</span>
          <span>
            {dayName(last.dayIndex)} · {daysAgo(last.finishedAt)}
          </span>
          <Icon name="right" size={18} />
        </button>
      )}

      {confirmDiscard && (
        <Modal
          title="Discard this workout?"
          tone="danger"
          onClose={() => setConfirmDiscard(false)}
          actions={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDiscard(false)}>
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-danger"
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
          The {loggedSets} logged {loggedSets === 1 ? 'set' : 'sets'} will be lost.
        </Modal>
      )}
    </>
  );
}
