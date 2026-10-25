import { Icon } from '../components/Icon';
import { Chip } from '../components/ui';
import { getExercise, TARGET_LABEL } from '../domain/exercises';
import { dayName, nextDayIndex } from '../domain/generator';
import { EXPERIENCE_LABEL, GOAL_RULES } from '../domain/goals';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { prescription, useBeginWorkout } from './common';

export function Plan() {
  const { data } = useStore();
  const nav = useNav();
  const begin = useBeginWorkout();
  const program = data.program!;
  const profile = data.profile!;
  const rules = GOAL_RULES[program.goal];
  const nextIdx = nextDayIndex(program, data.sessions);

  return (
    <>
      <header className="page-head row-between">
        <div>
          <p className="eyebrow">{EXPERIENCE_LABEL[profile.experience]}</p>
          <h1 className="display-sm">{rules.label}</h1>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => nav.go({ name: 'setup' })}>
          <Icon name="edit" size={16} /> Change
        </button>
      </header>

      <section className="card rules">
        <dl>
          <dt>Frequency</dt>
          <dd>{rules.frequency}</dd>
          <dt>Effort</dt>
          <dd>{rules.effort}</dd>
          <dt>Progress</dt>
          <dd>{rules.progression}</dd>
          <dt>Deload</dt>
          <dd>{rules.deload}</dd>
        </dl>
      </section>

      {data.active && (
        <p className="card note">
          <Icon name="timer" size={18} />
          <span>A workout is in progress. Starting any day resumes it.</span>
        </p>
      )}

      <div className="stack">
        {program.days.map((d) => (
          <section key={d.index} className={`card ${d.index === nextIdx ? 'card-next' : ''}`}>
            <div className="row-between">
              <h2 className="card-title">{dayName(d.index)}</h2>
              {d.index === nextIdx && <Chip tone="accent">Next up</Chip>}
            </div>
            <div className="chips">
              {d.focus.slice(0, 4).map((t) => (
                <Chip key={t}>{TARGET_LABEL[t]}</Chip>
              ))}
            </div>
            <ol className="hero-list">
              {d.exercises.map((p) => (
                <li key={p.exerciseId}>
                  <button type="button" className="link-row" onClick={() => nav.go({ name: 'exercise', id: p.exerciseId })}>
                    <span>{getExercise(p.exerciseId)?.name ?? p.exerciseId}</span>
                    <span className="mono">{prescription(p)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => begin(d.index)}>
              <Icon name="play" size={16} /> Start {dayName(d.index)}
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
