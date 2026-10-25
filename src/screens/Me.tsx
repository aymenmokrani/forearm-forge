import { useRef, useState } from 'react';
import { EquipGlyph, Icon } from '../components/Icon';
import { Modal } from '../components/ui';
import { EQUIPMENT_LABEL } from '../domain/exercises';
import { EXPERIENCE_LABEL, GOAL_RULES, SAFETY_FLAGS } from '../domain/goals';
import { defaultData, parseData } from '../domain/storage';
import type { AppData } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';

export function Me() {
  const { data, update } = useStore();
  const nav = useNav();
  const profile = data.profile!;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forearmforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onFile = async (file: File | undefined) => {
    setImportError(null);
    if (!file) return;
    const parsed = parseData(await file.text());
    if (!parsed || !parsed.profile || !parsed.program) setImportError("That file isn't a ForearmForge backup.");
    else setPendingImport(parsed);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <header className="page-head">
        <h1 className="display-sm">Me</h1>
      </header>

      <section className="card">
        <div className="row-between">
          <h2 className="label">Training setup</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => nav.go({ name: 'setup' })}>
            <Icon name="edit" size={16} /> Edit
          </button>
        </div>
        <dl className="kv">
          <dt>Goal</dt>
          <dd>{GOAL_RULES[profile.goal].label}</dd>
          <dt>Experience</dt>
          <dd>{EXPERIENCE_LABEL[profile.experience]}</dd>
          <dt>Days / week</dt>
          <dd>{profile.daysPerWeek}</dd>
        </dl>
        <ul className="equip-inline">
          {profile.equipment.map((e) => (
            <li key={e}>
              <EquipGlyph equipment={e} size={20} /> {EQUIPMENT_LABEL[e]}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="label">Units</h2>
        <div className="segmented" role="radiogroup" aria-label="Weight units">
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={data.units === u}
              className={data.units === u ? 'seg-on' : ''}
              onClick={() => update((d) => ({ ...d, units: u }))}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="label">Your data</h2>
        <p className="muted small">Everything stays on this device. Export a backup now and then.</p>
        <div className="stack-sm">
          <button type="button" className="btn btn-ghost btn-block" onClick={exportData}>
            <Icon name="download" size={18} /> Export backup
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          {importError && (
            <p className="error" role="alert">
              {importError}
            </p>
          )}
          <button type="button" className="btn btn-danger-ghost btn-block" onClick={() => setConfirmReset(true)}>
            <Icon name="trash" size={18} /> Reset everything
          </button>
        </div>
      </section>

      <section className="card safety-card">
        <h2 className="card-title">
          <Icon name="alert" size={18} /> Train safe
        </h2>
        <p>
          Tendons adapt slower than muscle: add load gradually (about 10% a week at most) and leave 48 h between hard grip
          days. Stop and see a professional for:
        </p>
        <ul className="flags">
          {SAFETY_FLAGS.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="muted small">ForearmForge gives general information, not medical advice.</p>
      </section>

      <p className="muted small center">ForearmForge v0.1 · works offline</p>

      {pendingImport && (
        <Modal
          title="Replace your data?"
          onClose={() => setPendingImport(null)}
          actions={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setPendingImport(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  update(() => pendingImport);
                  setPendingImport(null);
                }}
              >
                Replace
              </button>
            </>
          }
        >
          The backup has {pendingImport.sessions.length} workouts. It replaces everything on this device, including{' '}
          {data.sessions.length} current workouts.
        </Modal>
      )}

      {confirmReset && (
        <Modal
          title="Reset everything?"
          tone="danger"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  update(() => defaultData());
                  nav.tab('today');
                }}
              >
                Erase all data
              </button>
            </>
          }
        >
          Deletes your plan and all {data.sessions.length} workouts from this device. Export a backup first if you might want them.
        </Modal>
      )}
    </>
  );
}
