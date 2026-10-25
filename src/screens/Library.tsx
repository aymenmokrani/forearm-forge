import { useMemo, useState } from 'react';
import { EquipGlyph, Icon } from '../components/Icon';
import { Empty } from '../components/ui';
import { EQUIPMENT_LABEL, EXERCISES, isAvailable, TARGET_LABEL } from '../domain/exercises';
import { EQUIPMENT, TARGETS, type Equipment, type Target } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';

export function Library() {
  const { data } = useStore();
  const nav = useNav();
  const owned = data.profile?.equipment ?? ['bodyweight'];
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [target, setTarget] = useState<Target | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter(
      (ex) =>
        (!mineOnly || isAvailable(ex, owned)) &&
        (!equipment || ex.equipment.includes(equipment)) &&
        (!target || ex.targets.includes(target)) &&
        (!q || ex.name.toLowerCase().includes(q)),
    );
  }, [query, mineOnly, equipment, target, owned]);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{EXERCISES.length} exercises</p>
        <h1 className="display-sm">Library</h1>
      </header>

      <input
        className="search"
        type="search"
        placeholder="Search exercises"
        aria-label="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="segmented" role="radiogroup" aria-label="Which exercises">
        <button type="button" role="radio" aria-checked={mineOnly} className={mineOnly ? 'seg-on' : ''} onClick={() => setMineOnly(true)}>
          My equipment
        </button>
        <button type="button" role="radio" aria-checked={!mineOnly} className={!mineOnly ? 'seg-on' : ''} onClick={() => setMineOnly(false)}>
          Everything
        </button>
      </div>

      <div className="filter-row" role="group" aria-label="Filter by equipment">
        {EQUIPMENT.filter((e) => !mineOnly || owned.includes(e) || e === 'bodyweight').map((e) => (
          <button
            key={e}
            type="button"
            className={`filter ${equipment === e ? 'filter-on' : ''}`}
            aria-pressed={equipment === e}
            onClick={() => setEquipment(equipment === e ? null : e)}
          >
            <EquipGlyph equipment={e} size={18} /> {EQUIPMENT_LABEL[e]}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Filter by target">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter ${target === t ? 'filter-on' : ''}`}
            aria-pressed={target === t}
            onClick={() => setTarget(target === t ? null : t)}
          >
            {TARGET_LABEL[t]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty title="Nothing matches">
          <p>Try clearing a filter{mineOnly ? ' or switch to Everything' : ''}.</p>
        </Empty>
      ) : (
        <ul className="lib-list">
          {list.map((ex) => (
            <li key={ex.id}>
              <button type="button" className="lib-row" onClick={() => nav.go({ name: 'exercise', id: ex.id })}>
                <span className="lib-glyph">
                  <EquipGlyph equipment={ex.equipment.find((e) => e !== 'towel') ?? ex.equipment[0]!} size={24} />
                </span>
                <span className="lib-text">
                  <strong>{ex.name}</strong>
                  <span className="muted small">
                    {ex.targets.map((t) => TARGET_LABEL[t]).join(' · ')}
                  </span>
                </span>
                <span className="lib-meta">
                  <span className="mono small">{ex.type === 'hold' ? 'HOLD' : 'REPS'}</span>
                  <span className="dots" aria-label={`Difficulty ${ex.difficulty} of 3`}>
                    {[1, 2, 3].map((n) => (
                      <i key={n} className={n <= ex.difficulty ? 'dot-on' : ''} />
                    ))}
                  </span>
                </span>
                <Icon name="right" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
