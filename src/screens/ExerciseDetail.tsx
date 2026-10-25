import { ExercisePhotos } from '../components/ExercisePhotos';
import { Icon } from '../components/Icon';
import { Block, Empty, Huge, RoundButton } from '../components/ui';
import { GUIDES } from '../domain/guide';
import { EQUIPMENT_LABEL, getExercise, isAvailable, TARGET_LABEL } from '../domain/exercises';
import { computeBests } from '../domain/prs';
import { formatSeconds, toDisplay } from '../domain/units';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { formatDate } from './common';
import { entrySummary } from './SessionView';

export function ExerciseDetail({ id }: { id: string }) {
  const { data } = useStore();
  const nav = useNav();
  const ex = getExercise(id);

  if (!ex) {
    return (
      <div className="app">
        <Block>
          <RoundButton icon="back" label="Back" onClick={nav.back} />
        </Block>
        <main className="content">
          <Empty title="Exercise not found" />
        </main>
      </div>
    );
  }

  const owned = data.profile?.equipment ?? ['bodyweight'];
  const guide = GUIDES[id];
  const bests = computeBests(data.sessions).get(id);
  const recent = [...data.sessions]
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    .flatMap((s) => {
      const entry = s.entries.find((e) => e.exerciseId === id);
      return entry ? [{ session: s, entry }] : [];
    })
    .slice(0, 5);

  const best =
    bests?.maxWeight !== undefined
      ? { value: toDisplay(bests.maxWeight, data.units), label: data.units, sub: 'your heaviest set' }
      : bests?.maxSeconds !== undefined
        ? { value: bests.maxSeconds, label: 'seconds', sub: 'your longest hold' }
        : bests?.maxReps !== undefined
          ? { value: bests.maxReps, label: 'reps', sub: 'your best set' }
          : null;

  return (
    <div className="app">
      <Block>
        <RoundButton icon="back" label="Back" onClick={nav.back} />
        <div className="row-text">
          <span className="eyebrow">{ex.type === 'hold' ? 'Timed hold' : 'Reps'} · level {ex.difficulty} of 3</span>
          <h1 className="title">{ex.name}</h1>
        </div>
        {guide?.photos ? (
          <ExercisePhotos photos={guide.photos} name={ex.name} />
        ) : best ? (
          <Huge value={best.value} label={best.label} sub={best.sub} />
        ) : (
          <p className="muted small">Not logged yet. Your first session sets the baseline.</p>
        )}
      </Block>

      <main className="content">
        <section className="card">
          <h2 className="card-title">How to</h2>
          {guide ? (
            <ol className="stack" role="list">
              {guide.steps.map((s, k) => (
                <li key={s} className="step">
                  <span className="step-n">{k + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>{ex.cue}</p>
          )}
          <ul className="tags" role="list">
            {ex.targets.map((t) => (
              <li key={t} className="tag">
                {TARGET_LABEL[t]}
              </li>
            ))}
          </ul>
        </section>

        {guide && (
          <section className="card" style={{ gap: 8 }}>
            <p className="tip">
              <span className="mint" role="img" aria-label="Do">
                <Icon name="check" size={18} />
              </span>
              <span>{guide.do}</span>
            </p>
            <p className="tip">
              <span className="tip-avoid" role="img" aria-label="Avoid">
                <Icon name="close" size={18} />
              </span>
              <span>{guide.avoid}</span>
            </p>
          </section>
        )}

        {guide?.photos && best && (
          <section className="card" style={{ padding: '12px 18px' }}>
            <div className="row-between">
              <span className="muted small">{best.sub[0]!.toUpperCase() + best.sub.slice(1)}</span>
              <span className="num" style={{ fontSize: 22 }}>
                {best.value} {best.label}
              </span>
            </div>
          </section>
        )}

        <section className="card">
          <span className="eyebrow eyebrow-fog">Equipment</span>
          <p>{ex.equipment.map((e) => (e === 'bodyweight' ? 'None' : EQUIPMENT_LABEL[e])).join(' + ')}</p>
          {!isAvailable(ex, owned) && <p className="muted small">Not in your kit. Add it in Me, Edit kit, to get this in your plan.</p>}
        </section>

        {recent.length > 0 && (
          <section className="card" style={{ padding: '12px 18px', gap: 0 }}>
            <span className="eyebrow eyebrow-fog" style={{ paddingBottom: 4 }}>
              Recent
            </span>
            {recent.map(({ session, entry }) => (
              <div key={session.id} className="list-row">
                <span className="small">{formatDate(session.finishedAt)}</span>
                <span className="muted tiny">{entrySummary(entry, data.units)}</span>
              </div>
            ))}
          </section>
        )}

        {guide?.photos && <p className="photo-credit">Photos: free-exercise-db, public domain</p>}

        {bests?.maxSeconds !== undefined && bests.maxWeight !== undefined && (
          <p className="muted tiny">Longest hold: {formatSeconds(bests.maxSeconds)}</p>
        )}
      </main>
    </div>
  );
}
