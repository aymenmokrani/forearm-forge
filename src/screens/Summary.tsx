import type { CSSProperties } from 'react';
import { Block, Empty, Huge } from '../components/ui';
import { getExercise } from '../domain/exercises';
import { dayName } from '../domain/generator';
import { SAFETY_FLAGS } from '../domain/goals';
import { detectPRs, type PR } from '../domain/prs';
import { weeklyStreak } from '../domain/streak';
import { formatSeconds, toDisplay } from '../domain/units';
import { sessionStats } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { plural } from './common';
import { EntryList, prText } from './SessionView';

const BURST = ['#FF5F3F', '#FFC857', '#8EA2FF', '#4FE3B0'];

/** A small geometric burst behind the record number. Hidden under reduce-motion. */
function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 14 }, (_, k) => {
        const angle = (k / 14) * Math.PI * 2;
        const dist = 70 + (k % 3) * 22;
        const style = {
          background: BURST[k % BURST.length],
          '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
          '--dy': `${Math.round(Math.sin(angle) * dist * 0.7)}px`,
        } as CSSProperties;
        return <i key={k} style={style} />;
      })}
    </span>
  );
}

const ORDER: Record<PR['kind'], number> = { weight: 0, hold: 1, reps: 2 };

export function Summary({ id }: { id: string }) {
  const { data } = useStore();
  const nav = useNav();
  const session = data.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="app">
        <main className="content">
          <Empty title="Workout not found">
            <button type="button" className="btn btn-primary btn-block" onClick={() => nav.tab('today')}>
              Back to Today
            </button>
          </Empty>
        </main>
      </div>
    );
  }

  const prs = detectPRs(data.sessions, session);
  const top = [...prs].sort((a, b) => ORDER[a.kind] - ORDER[b.kind])[0];
  const st = sessionStats(session);
  const streak = weeklyStreak(data.sessions, data.profile?.daysPerWeek ?? 3, new Date(session.finishedAt));
  const pain = session.endedForPain;

  let head;
  if (pain) {
    head = (
      <>
        <div className="row-text">
          <span className="eyebrow eyebrow-pink">Workout stopped</span>
          <h1 className="title">Take care of that</h1>
        </div>
        <Huge value={st.sets} label={st.sets === 1 ? 'set saved' : 'sets saved'} sub={dayName(session.dayIndex)} />
      </>
    );
  } else if (top) {
    const value = top.kind === 'weight' ? toDisplay(top.value, data.units) : top.value;
    const unit = top.kind === 'weight' ? data.units : top.kind === 'hold' ? 's' : 'reps';
    head = (
      <>
        <span className="muted small">{dayName(session.dayIndex)} done</span>
        <div className="row-text">
          <span className="eyebrow eyebrow-gold">{prs.length > 1 ? `${prs.length} new records` : 'New record'}</span>
          <h1 className="title">{getExercise(top.exerciseId)?.name ?? top.exerciseId}</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <Confetti />
          <Huge gold size={120} value={value} label={unit} sub={prText(top, data.units).split(', ')[1]?.replace(/^up/, 'Up')} />
        </div>
      </>
    );
  } else {
    head = (
      <>
        <div className="row-text">
          <span className="eyebrow">Workout done</span>
          <h1 className="title">{dayName(session.dayIndex)}</h1>
        </div>
        <Huge value={st.sets} label={st.sets === 1 ? 'set logged' : 'sets logged'} sub={plural(session.entries.length, 'exercise')} />
      </>
    );
  }

  return (
    <div className="app">
      <Block tall>{head}</Block>
      <main className="content">
        <section className="card">
          <dl className="stats">
            <div>
              <dt>Time</dt>
              <dd>{formatSeconds(st.durationSec)}</dd>
            </div>
            <div>
              <dt>Sets</dt>
              <dd>{st.sets}</dd>
            </div>
            <div>
              <dt>This week</dt>
              <dd>
                {Math.min(streak.thisWeek, streak.target)}/{streak.target}
              </dd>
            </div>
          </dl>
        </section>

        {pain && (
          <section className="card card-quiet">
            <p className="muted small">Rest the area and drop the load next session. See a doctor or physio if you have any of these:</p>
            <ul className="flags">
              {SAFETY_FLAGS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        <EntryList session={session} units={data.units} prs={prs} onOpen={(exId) => nav.go({ name: 'exercise', id: exId })} />

        <button type="button" className="btn btn-primary btn-block push-down" onClick={() => nav.tab('today')}>
          Done
        </button>
      </main>
    </div>
  );
}
