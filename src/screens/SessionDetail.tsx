import { useState } from 'react';
import { Block, Empty, Huge, Modal, RoundButton } from '../components/ui';
import { getExercise } from '../domain/exercises';
import { dayName } from '../domain/generator';
import { detectPRs } from '../domain/prs';
import { formatSeconds } from '../domain/units';
import { sessionStats } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { formatDate } from './common';
import { EntryList, prText } from './SessionView';

export function SessionDetail({ id }: { id: string }) {
  const { data, update } = useStore();
  const nav = useNav();
  const [confirm, setConfirm] = useState(false);
  const session = data.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="app">
        <Block>
          <RoundButton icon="back" label="Back" onClick={nav.back} />
        </Block>
        <main className="content">
          <Empty title="This workout no longer exists" />
        </main>
      </div>
    );
  }

  const prs = detectPRs(data.sessions, session);
  const st = sessionStats(session);

  return (
    <div className="app">
      <Block>
        <div className="row-between">
          <RoundButton icon="back" label="Back" onClick={nav.back} />
          <button type="button" className="btn btn-text" onClick={() => setConfirm(true)}>
            Delete
          </button>
        </div>
        <div className="row-text">
          <span className={`eyebrow ${session.endedForPain ? 'eyebrow-pink' : ''}`}>
            {dayName(session.dayIndex)}
            {session.endedForPain ? ' · stopped for pain' : ''}
          </span>
          <h1 className="title">{formatDate(session.finishedAt)}</h1>
        </div>
        <Huge value={st.sets} label={st.sets === 1 ? 'set' : 'sets'} sub={formatSeconds(st.durationSec)} />
      </Block>
      <main className="content">
        {prs.length > 0 && (
          <section className="card">
            <span className="eyebrow eyebrow-gold">{prs.length === 1 ? 'New record' : `${prs.length} new records`}</span>
            {prs.map((pr) => (
              <p key={pr.exerciseId} className="small">
                <strong>{getExercise(pr.exerciseId)?.name ?? pr.exerciseId}</strong>
                <span className="muted"> · {prText(pr, data.units)}</span>
              </p>
            ))}
          </section>
        )}
        <EntryList session={session} units={data.units} prs={prs} onOpen={(exId) => nav.go({ name: 'exercise', id: exId })} />
      </main>
      {confirm && (
        <Modal
          title="Delete this workout?"
          tone="danger"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-safety"
                onClick={() => {
                  update((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
                  nav.back();
                }}
              >
                Delete
              </button>
            </>
          }
        >
          Its sets and any records it set will be removed. This can't be undone.
        </Modal>
      )}
    </div>
  );
}
