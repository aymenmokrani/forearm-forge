import { useState } from 'react';
import { Block, Huge } from '../components/ui';
import { getExercise, TARGET_LABEL } from '../domain/exercises';
import { DAY_LETTERS, dayName, nextDayIndex } from '../domain/generator';
import { EXPERIENCE_LABEL, GOAL_RULES } from '../domain/goals';
import { weekStart } from '../domain/streak';
import { sessionStats } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { plural, prescription, useBeginWorkout } from './common';

export function Plan() {
  const { data } = useStore();
  const nav = useNav();
  const begin = useBeginWorkout();
  const program = data.program!;
  const profile = data.profile!;
  const rules = GOAL_RULES[program.goal];
  const nextIdx = nextDayIndex(program, data.sessions);
  const [open, setOpen] = useState<number | null>(nextIdx);

  // The headline prescription is what the plan actually gives (beginners get a set less).
  const all = program.days.flatMap((d) => d.exercises);
  const rx = all.find((p) => p.reps !== undefined) ?? all[0];
  const thisWeek = data.sessions.filter((s) => Date.parse(s.finishedAt) >= weekStart(new Date()).getTime());

  return (
    <>
      <Block>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="row-text">
            <span className="eyebrow">Your plan</span>
            <h1 className="title" style={{ fontSize: 26 }}>
              {rules.label}
            </h1>
            <span className="muted small">
              {EXPERIENCE_LABEL[profile.experience]} · {profile.daysPerWeek}× a week
            </span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => nav.go({ name: 'setup' })}>
            Change
          </button>
        </div>
        {rx && (
          <Huge
            size={80}
            value={rx.reps !== undefined ? `${rx.sets}×${rx.reps}` : `${rx.sets}×${rx.holdSec}s`}
            label={rx.reps !== undefined ? 'sets × reps' : 'sets × seconds'}
            sub={`Rest ${rx.restSec} s · holds ${rules.holdSec} s`}
          />
        )}
      </Block>

      <main className="content">
        <section className="card">
          <p className="muted">{rules.progression}</p>
          <details>
            <summary>Effort, frequency and deload</summary>
            <dl className="kv" style={{ marginTop: 8 }}>
              <dt>Effort</dt>
              <dd>{rules.effort}</dd>
              <dt>How often</dt>
              <dd>{rules.frequency}</dd>
              <dt>Deload</dt>
              <dd>{rules.deload}</dd>
            </dl>
          </details>
        </section>

        {data.active && <p className="muted small">A workout is in progress. Starting any day resumes it.</p>}

        <span className="eyebrow eyebrow-fog">This week</span>
        {program.days.map((d) => {
          const done = [...thisWeek].reverse().find((s) => s.dayIndex === d.index);
          const next = d.index === nextIdx;
          const isOpen = open === d.index;
          const status = done
            ? `Done ${new Date(done.finishedAt).toLocaleDateString(undefined, { weekday: 'long' })} · ${plural(sessionStats(done).sets, 'set')}`
            : next
              ? `Next up · ${plural(d.exercises.length, 'exercise')}`
              : `${d.focus.slice(0, 2).map((t) => TARGET_LABEL[t]).join(' and ')} · ${plural(d.exercises.length, 'exercise')}`;
          return (
            <section key={d.index} className="card card-tight">
              <button
                type="button"
                className="list-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : d.index)}
                style={{ padding: 0 }}
              >
                <span className="row" style={{ gap: 14 }}>
                  <span className={`letter ${done ? 'letter-done' : next ? 'letter-next' : ''}`}>{DAY_LETTERS[d.index]}</span>
                  <span className="row-text">
                    <span className="card-title">{dayName(d.index)}</span>
                    <span className={`small ${next && !done ? 'soft-coral' : 'muted'}`}>{status}</span>
                  </span>
                </span>
              </button>
              {isOpen && (
                <>
                  <div className="tags" style={{ paddingLeft: 58 }}>
                    {d.focus.slice(0, 4).map((t) => (
                      <span key={t} className="tag">
                        {TARGET_LABEL[t]}
                      </span>
                    ))}
                  </div>
                  <div style={{ paddingLeft: 58 }}>
                    {d.exercises.map((p) => (
                      <button key={p.exerciseId} type="button" className="list-row" onClick={() => nav.go({ name: 'exercise', id: p.exerciseId })}>
                        <span className="row-name">{getExercise(p.exerciseId)?.name ?? p.exerciseId}</span>
                        <span className="muted small num">{prescription(p)}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`btn btn-block ${next ? 'btn-primary btn-sm-primary' : 'btn-secondary'}`}
                    onClick={() => begin(d.index)}
                  >
                    Start {dayName(d.index)}
                  </button>
                </>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
