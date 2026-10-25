import { Icon } from '../components/Icon';
import { getExercise } from '../domain/exercises';
import type { PR } from '../domain/prs';
import type { LoggedSet, Session, Units } from '../domain/types';
import { formatSeconds, formatWeight } from '../domain/units';
import { sessionStats } from '../domain/workout';

export function describeSet(s: LoggedSet, units: Units): string {
  return [
    s.seconds !== undefined ? formatSeconds(s.seconds) : null,
    s.reps !== undefined ? `${s.reps}` : null,
    s.weight ? `@ ${formatWeight(s.weight, units)}` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function prText(pr: PR, units: Units): string {
  if (pr.kind === 'weight') return `${formatWeight(pr.value, units)} (was ${formatWeight(pr.previous, units)})`;
  if (pr.kind === 'hold') return `${formatSeconds(pr.value)} hold (was ${formatSeconds(pr.previous)})`;
  return `${pr.value} reps (was ${pr.previous})`;
}

export function StatsRow({ session, units }: { session: Session; units: Units }) {
  const st = sessionStats(session);
  return (
    <dl className="stats">
      <div>
        <dt>Time</dt>
        <dd>{formatSeconds(st.durationSec)}</dd>
      </div>
      <div>
        <dt>Sets</dt>
        <dd>{st.sets}</dd>
      </div>
      {st.volume > 0 && (
        <div>
          <dt>Volume</dt>
          <dd>{formatWeight(st.volume, units)}</dd>
        </div>
      )}
      {st.holdSec > 0 && (
        <div>
          <dt>Holding</dt>
          <dd>{formatSeconds(st.holdSec)}</dd>
        </div>
      )}
    </dl>
  );
}

export function PRList({ prs, units }: { prs: PR[]; units: Units }) {
  if (prs.length === 0) return null;
  return (
    <section className="card pr-card">
      <h2 className="card-title">
        <Icon name="trophy" size={18} /> {prs.length} new {prs.length === 1 ? 'record' : 'records'}
      </h2>
      <ul className="plain-list">
        {prs.map((pr) => (
          <li key={pr.exerciseId}>
            <strong>{getExercise(pr.exerciseId)?.name ?? pr.exerciseId}</strong>
            <span className="muted"> · {prText(pr, units)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EntryList({ session, units, prs, onOpen }: { session: Session; units: Units; prs: PR[]; onOpen: (id: string) => void }) {
  return (
    <div className="stack">
      {session.entries.map((e) => (
        <button key={e.exerciseId} type="button" className="card entry" onClick={() => onOpen(e.exerciseId)}>
          <div className="row-between">
            <h3 className="card-title">{getExercise(e.exerciseId)?.name ?? e.exerciseId}</h3>
            {prs.some((p) => p.exerciseId === e.exerciseId) && (
              <span className="chip chip-gold">
                <Icon name="trophy" size={14} /> PR
              </span>
            )}
          </div>
          <ol className="entry-sets">
            {e.sets.map((s, k) => (
              <li key={k} className="mono">
                {describeSet(s, units)}
              </li>
            ))}
          </ol>
        </button>
      ))}
    </div>
  );
}
