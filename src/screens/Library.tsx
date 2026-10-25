import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Block, Empty, Huge } from '../components/ui';
import { EXERCISES, isAvailable, TARGET_LABEL } from '../domain/exercises';
import { TARGETS, type Target } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';

export function Library() {
  const { data } = useStore();
  const nav = useNav();
  const owned = data.profile?.equipment ?? ['bodyweight'];
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const [holdsOnly, setHoldsOnly] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter(
      (ex) =>
        (!mineOnly || isAvailable(ex, owned)) &&
        (!holdsOnly || ex.type === 'hold') &&
        (!target || ex.targets.includes(target)) &&
        (!q || ex.name.toLowerCase().includes(q)),
    );
  }, [query, mineOnly, holdsOnly, target, owned]);
  const fit = EXERCISES.filter((ex) => isAvailable(ex, owned)).length;

  return (
    <>
      <Block>
        <h1 className="title">Library</h1>
        <Huge value={list.length} label={list.length === 1 ? 'exercise' : 'exercises'} sub={`${fit} of ${EXERCISES.length} fit your kit`} />
      </Block>

      <main className="content">
        <input
          className="search"
          type="search"
          placeholder="Search exercises"
          aria-label="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="chip-row" role="group" aria-label="Filters">
          <button type="button" className={`chip ${mineOnly ? 'chip-on' : ''}`} aria-pressed={mineOnly} onClick={() => setMineOnly(!mineOnly)}>
            {mineOnly && <Icon name="check" size={16} />} My kit
          </button>
          <button type="button" className={`chip ${holdsOnly ? 'chip-on' : ''}`} aria-pressed={holdsOnly} onClick={() => setHoldsOnly(!holdsOnly)}>
            Holds
          </button>
          {TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${target === t ? 'chip-on' : ''}`}
              aria-pressed={target === t}
              onClick={() => setTarget(target === t ? null : t)}
            >
              {TARGET_LABEL[t]}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <Empty title="Nothing matches">
            <p className="muted small">Try clearing a filter{mineOnly ? ' or turn off My kit' : ''}.</p>
          </Empty>
        ) : (
          <ul className="stack" style={{ gap: 8 }}>
            {list.map((ex) => (
              <li key={ex.id}>
                <button type="button" className="card card-tight" onClick={() => nav.go({ name: 'exercise', id: ex.id })}>
                  <span className="row-between">
                    <span className="row-text">
                      <span className="card-title" style={{ fontSize: 16 }}>
                        {ex.name}
                      </span>
                      <span className="muted tiny">
                        {ex.targets.map((t) => TARGET_LABEL[t]).join(' · ')}
                        {ex.equipment.every((e) => e === 'bodyweight') ? ' · no equipment' : ''}
                      </span>
                    </span>
                    <span className={`tag ${ex.type === 'hold' ? 'tag-peri' : ''}`}>{ex.type === 'hold' ? 'Hold' : 'Reps'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
