import { EquipGlyph, Icon } from '../components/Icon';
import { Chip, Empty, TopBar } from '../components/ui';
import { EQUIPMENT_LABEL, getExercise, isAvailable, TARGET_LABEL } from '../domain/exercises';
import { computeBests } from '../domain/prs';
import { formatSeconds, formatWeight } from '../domain/units';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { formatDate } from './common';
import { describeSet } from './SessionView';

export function ExerciseDetail({ id }: { id: string }) {
  const { data } = useStore();
  const nav = useNav();
  const ex = getExercise(id);

  if (!ex) {
    return (
      <div className="app">
        <TopBar title="Exercise" onBack={nav.back} />
        <main className="screen">
          <Empty title="Exercise not found" />
        </main>
      </div>
    );
  }

  const owned = data.profile?.equipment ?? ['bodyweight'];
  const bests = computeBests(data.sessions).get(id);
  const recent = [...data.sessions]
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    .flatMap((s) => {
      const entry = s.entries.find((e) => e.exerciseId === id);
      return entry ? [{ session: s, sets: entry.sets }] : [];
    })
    .slice(0, 5);

  return (
    <div className="app">
      <TopBar title="Exercise" onBack={nav.back} />
      <main className="screen screen-pad-bottom">
        <h1 className="display-sm">{ex.name}</h1>
        <div className="chips">
          <Chip tone="accent">{ex.type === 'hold' ? 'Timed hold' : 'Reps'}</Chip>
          <Chip>Level {ex.difficulty} / 3</Chip>
          {ex.targets.map((t) => (
            <Chip key={t}>{TARGET_LABEL[t]}</Chip>
          ))}
        </div>

        <section className="card">
          <h2 className="label">How to</h2>
          <p className="cue-lg">{ex.cue}</p>
        </section>

        <section className="card">
          <h2 className="label">Equipment</h2>
          <ul className="equip-inline">
            {ex.equipment.map((e) => (
              <li key={e}>
                <EquipGlyph equipment={e} size={22} /> {EQUIPMENT_LABEL[e]}
              </li>
            ))}
          </ul>
          {!isAvailable(ex, owned) && (
            <p className="note-inline">
              <Icon name="alert" size={16} /> Not in your kit. Add the equipment in Me → Training setup to get it in your plan.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="label">Your best</h2>
          {bests ? (
            <dl className="stats">
              {bests.maxWeight !== undefined && (
                <div>
                  <dt>Heaviest</dt>
                  <dd>{formatWeight(bests.maxWeight, data.units)}</dd>
                </div>
              )}
              {bests.maxSeconds !== undefined && (
                <div>
                  <dt>Longest</dt>
                  <dd>{formatSeconds(bests.maxSeconds)}</dd>
                </div>
              )}
              {bests.maxReps !== undefined && (
                <div>
                  <dt>Most reps</dt>
                  <dd>{bests.maxReps}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="muted">Not logged yet. Your first session sets the baseline.</p>
          )}
        </section>

        {recent.length > 0 && (
          <section className="card">
            <h2 className="label">Recent</h2>
            <ul className="recent">
              {recent.map(({ session, sets }) => (
                <li key={session.id}>
                  <span>{formatDate(session.finishedAt)}</span>
                  <span className="mono small">{sets.map((s) => describeSet(s, data.units)).join(', ')}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
