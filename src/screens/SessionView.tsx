import { getExercise } from '../domain/exercises';
import { getGripper } from '../domain/ladder';
import type { PR } from '../domain/prs';
import type { SessionEntry, Session, Units } from '../domain/types';
import { formatSeconds, formatWeight } from '../domain/units';
import { plural } from './common';

export function prText(pr: PR, units: Units): string {
  if (pr.kind === 'weight') return `${formatWeight(pr.value, units)}, up from ${formatWeight(pr.previous, units)}`;
  if (pr.kind === 'hold') return `${formatSeconds(pr.value)} hold, up from ${formatSeconds(pr.previous)}`;
  return `${pr.value} reps, up from ${pr.previous}`;
}

/** One line per exercise: how many sets and the best of them. */
export function entrySummary(e: SessionEntry, units: Units): string {
  const n = e.sets.length;
  const weights = e.sets.map((s) => s.weight ?? 0).filter((w) => w > 0);
  const seconds = e.sets.map((s) => s.seconds ?? 0).filter((v) => v > 0);
  const gripSets = e.sets.filter((s) => s.gripper);
  if (gripSets.length > 0) {
    const full = gripSets.filter((s) => s.close === 'full').length;
    const heaviest = gripSets.map((s) => getGripper(s.gripper!)).sort((a, b) => b.kg - a.kg)[0]!;
    return `${plural(n, 'set')} · ${heaviest.name} · ${full} full ${full === 1 ? 'close' : 'closes'}`;
  }
  if (weights.length > 0) return `${plural(n, 'set')} · top ${formatWeight(Math.max(...weights), units)}`;
  if (seconds.length > 0) return `${plural(n, 'hold')} · best ${formatSeconds(Math.max(...seconds))}`;
  return `${plural(n, 'set')} · best ${Math.max(0, ...e.sets.map((s) => s.reps ?? 0))} reps`;
}

export function EntryList({ session, units, prs, onOpen }: { session: Session; units: Units; prs: PR[]; onOpen: (id: string) => void }) {
  return (
    <section className="card" style={{ padding: '6px 18px', gap: 0 }}>
      {session.entries.map((e) => (
        <button key={e.exerciseId} type="button" className="list-row" style={{ minHeight: 56 }} onClick={() => onOpen(e.exerciseId)}>
          <span className="row-text">
            <span className="row-name">{getExercise(e.exerciseId)?.name ?? e.exerciseId}</span>
            <span className="muted tiny">{entrySummary(e, units)}</span>
          </span>
          {prs.some((p) => p.exerciseId === e.exerciseId) && <span className="tag tag-gold">Record</span>}
        </button>
      ))}
    </section>
  );
}
