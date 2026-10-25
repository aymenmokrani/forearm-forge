import { Icon } from '../components/Icon';
import { Empty } from '../components/ui';
import { dayName } from '../domain/generator';
import { SAFETY_FLAGS } from '../domain/goals';
import { detectPRs } from '../domain/prs';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { EntryList, PRList, StatsRow } from './SessionView';

export function Summary({ id }: { id: string }) {
  const { data } = useStore();
  const nav = useNav();
  const session = data.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="app">
        <main className="screen">
          <Empty title="Workout not found">
            <button type="button" className="btn btn-primary" onClick={() => nav.tab('today')}>
              Back to Today
            </button>
          </Empty>
        </main>
      </div>
    );
  }

  const prs = detectPRs(data.sessions, session);

  return (
    <div className="app">
      <main className="screen screen-pad-bottom">
        <header className="summary-head">
          <span className={`summary-badge ${session.endedForPain ? 'summary-badge-warn' : ''}`}>
            <Icon name={session.endedForPain ? 'alert' : 'check'} size={32} />
          </span>
          <p className="eyebrow">{dayName(session.dayIndex)}</p>
          <h1 className="display-sm">{session.endedForPain ? 'Workout stopped' : 'Workout logged'}</h1>
        </header>

        <StatsRow session={session} units={data.units} />

        {session.endedForPain && (
          <section className="card safety-card">
            <h2 className="card-title">
              <Icon name="alert" size={18} /> Take care of that
            </h2>
            <p>Rest the area and drop the load next session. See a doctor or physio if you have any of these:</p>
            <ul className="flags">
              {SAFETY_FLAGS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        <PRList prs={prs} units={data.units} />
        <EntryList session={session} units={data.units} prs={prs} onOpen={(exId) => nav.go({ name: 'exercise', id: exId })} />

        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => nav.tab('today')}>
          Done
        </button>
      </main>
    </div>
  );
}
