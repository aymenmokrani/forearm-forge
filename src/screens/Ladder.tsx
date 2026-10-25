import { Icon } from '../components/Icon';
import { Bars, Block, Huge, RoundButton } from '../components/ui';
import { buildLadder, CLOSES_TO_CLAIM, GRIPPERS } from '../domain/ladder';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { daysAgo } from './common';

export function Ladder() {
  const { data } = useStore();
  const nav = useNav();
  const { rungs, level, next } = buildLadder(data.sessions);
  const climbed = rungs.filter((r) => r.claimed).length;
  const headline = level ?? rungs[0]!;
  // Like the approved design: the two rungs above the next target, not the whole tower.
  const topShown = Math.min(rungs.length - 1, rungs.indexOf(next ?? rungs[rungs.length - 1]!) + 2);
  const hidden = rungs.length - 1 - topShown;

  return (
    <div className="app">
      <Block>
        <div className="row">
          <RoundButton icon="back" label="Back" onClick={nav.back} />
          <h1 className="title-sm">Gripper ladder</h1>
        </div>
        <span className="eyebrow">{level ? 'Your level' : 'First rung'}</span>
        <Huge
          value={headline.kg}
          label={`kg · ${headline.name}`}
          sub={level ? `${climbed} of ${GRIPPERS.length} rungs climbed` : 'Not claimed yet'}
        />
        <p className="muted small">Close a gripper fully in {CLOSES_TO_CLAIM} separate sessions to claim its rung.</p>
      </Block>

      <main className="content">
        {hidden > 0 && <p className="faint tiny">+{hidden} heavier {hidden === 1 ? 'rung' : 'rungs'}, up to {rungs[rungs.length - 1]!.name}</p>}
        <ol className="stack" style={{ gap: 8 }}>
          {rungs.slice(0, topShown + 1).reverse().map((r) => {
            if (next && r.id === next.id) {
              return (
                <li key={r.id} className="rung rung-next">
                  <div className="row-between">
                    <span className="eyebrow">Next target</span>
                    {r.lastFullAt && <span className="muted tiny">last full close {daysAgo(r.lastFullAt)}</span>}
                  </div>
                  <div className="row-between" style={{ alignItems: 'flex-end' }}>
                    <span className="row" style={{ alignItems: 'baseline', gap: 10 }}>
                      <span className="num" style={{ fontSize: 24 }}>
                        {r.name}
                      </span>
                      <span className="muted small">{r.kg} kg</span>
                    </span>
                    <span className="small peri" style={{ fontWeight: 600 }}>
                      {r.sessions} of {CLOSES_TO_CLAIM} closes
                    </span>
                  </div>
                  <Bars filled={r.sessions} total={CLOSES_TO_CLAIM} tone="peri" label={`${r.sessions} of ${CLOSES_TO_CLAIM} full closes`} />
                </li>
              );
            }
            if (r.claimed) {
              return (
                <li key={r.id} className="rung">
                  <span className="row" style={{ alignItems: 'baseline', gap: 10 }}>
                    <span className="rung-name">{r.name}</span>
                    <span className="muted tiny">{r.kg} kg</span>
                  </span>
                  <span className="row mint tiny" style={{ gap: 6 }}>
                    <Icon name="check" size={18} /> Claimed
                  </span>
                </li>
              );
            }
            return (
              <li key={r.id} className="rung rung-locked">
                <span className="row" style={{ alignItems: 'baseline', gap: 10 }}>
                  <span className="rung-name">{r.name}</span>
                  <span className="faint tiny">{r.kg} kg</span>
                </span>
                <span className="faint tiny">{r.sessions > 0 ? `${r.sessions} of ${CLOSES_TO_CLAIM}` : 'Locked'}</span>
              </li>
            );
          })}
        </ol>
        <p className="faint tiny center">Ratings are nominal; real grippers vary a little from batch to batch.</p>
      </main>
    </div>
  );
}
