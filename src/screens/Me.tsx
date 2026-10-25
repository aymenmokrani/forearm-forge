import { useRef, useState } from 'react';
import { Block, Huge, Modal } from '../components/ui';
import { EQUIPMENT_LABEL } from '../domain/exercises';
import { EXPERIENCE_LABEL, GOAL_RULES, SAFETY_FLAGS } from '../domain/goals';
import { defaultData, parseData } from '../domain/storage';
import type { AppData } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { plural } from './common';

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
      <Block>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="row-text">
            <span className="eyebrow">Your training</span>
            <h1 className="title" style={{ fontSize: 26 }}>
              {GOAL_RULES[profile.goal].label}
            </h1>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => nav.go({ name: 'setup' })}>
            Edit
          </button>
        </div>
        <Huge value={`${profile.daysPerWeek}×`} label="a week" sub={EXPERIENCE_LABEL[profile.experience]} />
      </Block>

      <main className="content">
        <section className="card">
          <div className="row-between">
            <h2 className="card-title">Your kit</h2>
            <button type="button" className="btn btn-text soft-coral" onClick={() => nav.go({ name: 'setup' })}>
              Edit kit
            </button>
          </div>
          <ul className="tags">
            {profile.equipment.map((e) => (
              <li key={e} className="tag" style={{ color: 'var(--ice)', fontSize: 14, padding: '8px 14px' }}>
                {e === 'bodyweight' ? 'Bodyweight' : EQUIPMENT_LABEL[e]}
              </li>
            ))}
          </ul>
        </section>

        <section className="card" style={{ padding: '10px 12px 10px 18px' }}>
          <div className="row-between">
            <h2 className="card-title">Units</h2>
            <div className="seg" role="radiogroup" aria-label="Weight units">
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
          </div>
        </section>

        <section className="card" style={{ padding: '10px 12px 10px 18px' }}>
          <div className="row-between">
            <div className="row-text">
              <h2 className="card-title">Sounds</h2>
              <span className="muted tiny">Timer ticks, set logged, records</span>
            </div>
            <div className="seg" role="radiogroup" aria-label="Sounds">
              {([false, true] as const).map((off) => (
                <button
                  key={String(off)}
                  type="button"
                  role="radio"
                  aria-checked={!!data.soundOff === off}
                  className={!!data.soundOff === off ? 'seg-on' : ''}
                  onClick={() => update((d) => ({ ...d, soundOff: off || undefined }))}
                >
                  {off ? 'Off' : 'On'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="row-text">
            <h2 className="card-title">Your data</h2>
            <p className="muted tiny">Everything stays on this device. Export a backup now and then.</p>
          </div>
          <div className="btn-pair">
            <button type="button" className="btn btn-secondary" onClick={exportData}>
              Export backup
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              Import backup
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          {importError && (
            <p className="error" role="alert">
              {importError}
            </p>
          )}
          <button type="button" className="btn btn-safety btn-block" onClick={() => setConfirmReset(true)}>
            Reset everything
          </button>
        </section>

        <section className="card card-quiet">
          <span className="eyebrow eyebrow-pink">Train safe</span>
          <p className="muted small">
            Tendons adapt slower than muscle. Add load gradually, about 10% a week at most, and leave 48 h between hard grip days. Stop and
            see a professional for:
          </p>
          <ul className="flags">
            {SAFETY_FLAGS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="faint tiny">ForearmForge gives general information, not medical advice.</p>
        </section>

        <p className="faint tiny center">ForearmForge v2 · works offline</p>
      </main>

      {pendingImport && (
        <Modal
          title="Replace your data?"
          onClose={() => setPendingImport(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setPendingImport(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm-primary"
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
          The backup has {plural(pendingImport.sessions.length, 'workout')}. It replaces everything on this device, including{' '}
          {plural(data.sessions.length, 'current workout')}.
        </Modal>
      )}

      {confirmReset && (
        <Modal
          title="Reset everything?"
          tone="danger"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-safety"
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
          Deletes your plan and all {plural(data.sessions.length, 'workout')} from this device. Export a backup first if you might want them.
        </Modal>
      )}
    </>
  );
}
