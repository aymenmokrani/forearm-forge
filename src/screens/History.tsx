import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Empty, Modal, TopBar } from '../components/ui';
import { dayName } from '../domain/generator';
import { detectPRs } from '../domain/prs';
import { formatSeconds } from '../domain/units';
import { sessionStats } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { formatDate } from './common';
import { EntryList, PRList, StatsRow } from './SessionView';

export function History() {
  const { data } = useStore();
  const nav = useNav();
  const sessions = [...data.sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{sessions.length} workouts</p>
        <h1 className="display-sm">History</h1>
      </header>
      {sessions.length === 0 ? (
        <Empty title="No workouts yet">
          <p>Finish your first session and it shows up here, with every set and record.</p>
          <button type="button" className="btn btn-primary" onClick={() => nav.tab('today')}>
            Go to Today
          </button>
        </Empty>
      ) : (
        <ul className="stack">
          {sessions.map((s) => {
            const st = sessionStats(s);
            const prs = detectPRs(data.sessions, s).length;
            return (
              <li key={s.id}>
                <button type="button" className="card history-row" onClick={() => nav.go({ name: 'session', id: s.id })}>
                  <span className="history-date">
                    <strong>{formatDate(s.finishedAt)}</strong>
                    <span className="muted small">{dayName(s.dayIndex)}</span>
                  </span>
                  <span className="history-meta mono small">
                    {st.sets} {st.sets === 1 ? 'set' : 'sets'} · {formatSeconds(st.durationSec)}
                  </span>
                  {prs > 0 && (
                    <span className="chip chip-gold">
                      <Icon name="trophy" size={14} /> {prs}
                    </span>
                  )}
                  {s.endedForPain && <Icon name="alert" size={16} className="warn" />}
                  <Icon name="right" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function SessionDetail({ id }: { id: string }) {
  const { data, update } = useStore();
  const nav = useNav();
  const [confirm, setConfirm] = useState(false);
  const session = data.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="app">
        <TopBar title="Workout" onBack={nav.back} />
        <main className="screen">
          <Empty title="This workout no longer exists" />
        </main>
      </div>
    );
  }

  const prs = detectPRs(data.sessions, session);

  return (
    <div className="app">
      <TopBar
        title={formatDate(session.finishedAt)}
        onBack={nav.back}
        right={
          <button type="button" className="icon-btn" aria-label="Delete workout" onClick={() => setConfirm(true)}>
            <Icon name="trash" />
          </button>
        }
      />
      <main className="screen screen-pad-bottom">
        <p className="eyebrow">{dayName(session.dayIndex)}</p>
        <StatsRow session={session} units={data.units} />
        <PRList prs={prs} units={data.units} />
        <EntryList session={session} units={data.units} prs={prs} onOpen={(exId) => nav.go({ name: 'exercise', id: exId })} />
      </main>
      {confirm && (
        <Modal
          title="Delete this workout?"
          tone="danger"
          onClose={() => setConfirm(false)}
          actions={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
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
