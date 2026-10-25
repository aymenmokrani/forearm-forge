import { useMemo, useState } from 'react';
import { Block, Empty, Huge } from '../components/ui';
import { getExercise } from '../domain/exercises';
import { dayName } from '../domain/generator';
import { latestMeasurement } from '../domain/measure';
import { detectPRs } from '../domain/prs';
import { chartableExercises, exerciseSeries, inRange, RANGE_LABEL, rangeStart, type Metric, type Point, type Range } from '../domain/progress';
import type { Units } from '../domain/types';
import { formatSeconds, round1, toDisplay } from '../domain/units';
import { sessionStats } from '../domain/workout';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { formatDate, plural } from './common';

const METRIC_LABEL: Record<Metric, string> = { weight: 'Heaviest set', seconds: 'Longest hold', reps: 'Most reps' };

function formatter(metric: Metric, units: Units) {
  if (metric === 'weight') return (v: number) => `${toDisplay(v, units)} ${units}`;
  if (metric === 'seconds') return (v: number) => formatSeconds(v);
  return (v: number) => `${round1(v)} reps`;
}

/** Heaviest set over time: periwinkle line, gold dots on records. */
function Chart({ points, format }: { points: Point[]; format: (v: number) => string }) {
  const W = 300;
  const H = 140;
  const X0 = 44;
  const X1 = 292;
  const Y0 = 12;
  const Y1 = 122;
  const values = points.map((p) => p.value);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const pad = (hi - lo) * 0.2 || Math.max(1, hi * 0.15);
  lo = Math.max(0, lo - pad);
  hi += pad;
  const t0 = Date.parse(points[0]!.at);
  const t1 = Date.parse(points[points.length - 1]!.at);
  const x = (at: string) => (t1 === t0 ? (X0 + X1) / 2 : X0 + ((Date.parse(at) - t0) / (t1 - t0)) * (X1 - X0));
  const y = (v: number) => Y1 - ((v - lo) / (hi - lo)) * (Y1 - Y0);
  const line = points.map((p) => `${x(p.at).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo, (lo + hi) / 2, hi];
  const last = points[points.length - 1]!;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${points.length} sessions, from ${format(points[0]!.value)} to ${format(last.value)}`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={X0} x2={X1} y1={y(v)} y2={y(v)} stroke="var(--track)" strokeWidth="1" />
          <text x="0" y={y(v) + 4} fill="var(--haze)" fontSize="11" fontFamily="Outfit, sans-serif">
            {format(round1(v))}
          </text>
        </g>
      ))}
      {points.length > 1 && (
        <>
          <polygon points={`${x(points[0]!.at)},${Y1} ${line} ${x(last.at)},${Y1}`} fill="rgba(142,162,255,0.10)" />
          <polyline points={line} fill="none" stroke="var(--peri)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {points.map((p) =>
        p.record ? (
          <circle key={p.at} cx={x(p.at)} cy={y(p.value)} r="5" fill="var(--gold)" stroke="var(--card)" strokeWidth="2.5" />
        ) : null,
      )}
      {!last.record && <circle cx={x(last.at)} cy={y(last.value)} r="4.5" fill="var(--peri)" stroke="var(--card)" strokeWidth="2.5" />}
    </svg>
  );
}

function axisLabels(points: Point[]): string[] {
  const t0 = Date.parse(points[0]!.at);
  const t1 = Date.parse(points[points.length - 1]!.at);
  const long = t1 - t0 > 45 * 86_400_000;
  const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, long ? { month: 'short' } : { day: 'numeric', month: 'short' });
  return t1 === t0 ? [fmt(t0)] : [fmt(t0), fmt((t0 + t1) / 2), fmt(t1)];
}

export function Progress() {
  const { data } = useStore();
  const nav = useNav();
  const [range, setRange] = useState<Range>('12w');
  const [showAll, setShowAll] = useState(false);
  const exercises = useMemo(() => chartableExercises(data.sessions), [data.sessions]);
  const [picked, setPicked] = useState<string | null>(null);
  const exerciseId = picked && exercises.includes(picked) ? picked : exercises[0];

  const start = rangeStart(range);
  const inWindow = data.sessions.filter((s) => inRange(s, start));
  const records = useMemo(() => inWindow.reduce((n, s) => n + detectPRs(data.sessions, s).length, 0), [inWindow, data.sessions]);
  const measure = latestMeasurement(data.measurements);
  const hasGripper = data.profile?.equipment.includes('gripper') || data.sessions.some((s) => s.entries.some((e) => e.sets.some((x) => x.gripper)));
  const sessions = [...data.sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));

  const series = exerciseId ? exerciseSeries(data.sessions, exerciseId) : null;
  const points = series ? series.points.filter((p) => !start || Date.parse(p.at) >= start.getTime()) : [];
  const format = series ? formatter(series.metric, data.units) : String;
  const delta = points.length > 1 ? points[points.length - 1]!.value - points[0]!.value : 0;
  const since = range === 'all' ? (points[0] ? `since ${formatDate(points[0].at)}` : '') : `in ${range === '4w' ? 4 : 12} weeks`;

  return (
    <>
      <Block>
        <div className="row-between">
          <h1 className="title">Progress</h1>
          <div className="seg" role="radiogroup" aria-label="Time range">
            {(['4w', '12w', 'all'] as const).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={range === r} className={range === r ? 'seg-on' : ''} onClick={() => setRange(r)}>
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div className="row-between" style={{ alignItems: 'flex-end' }}>
          <Huge value={inWindow.length} label={inWindow.length === 1 ? 'workout' : 'workouts'} sub={range === 'all' ? 'all time' : `in ${range === '4w' ? 4 : 12} weeks`} />
          <div className="row-text" style={{ alignItems: 'flex-end', textAlign: 'right', gap: 10 }}>
            <span className="row-text" style={{ alignItems: 'flex-end' }}>
              <span className="num gold" style={{ fontSize: 20 }}>
                {records}
              </span>
              <span className="muted tiny">{records === 1 ? 'record' : 'records'}</span>
            </span>
            <span className="row-text" style={{ alignItems: 'flex-end' }}>
              <span className="num" style={{ fontSize: 20 }}>
                {measure ? `${Math.max(measure.left, measure.right)} cm` : '–'}
              </span>
              <span className="muted tiny">forearm</span>
            </span>
          </div>
        </div>
      </Block>

      <main className="content">
        {sessions.length === 0 ? (
          <Empty title="No workouts yet">
            <p className="muted small">Finish your first workout and your trend, records and history show up here.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => nav.tab('today')}>
              Go to Today
            </button>
          </Empty>
        ) : (
          <>
            {(exercises.length > 0 || hasGripper) && (
              <div className="chip-row" role="group" aria-label="Exercise">
                {exercises.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${id === exerciseId ? 'chip-on' : ''}`}
                    aria-pressed={id === exerciseId}
                    onClick={() => setPicked(id)}
                  >
                    {getExercise(id)?.name ?? id}
                  </button>
                ))}
                {hasGripper && (
                  <button type="button" className="chip" onClick={() => nav.go({ name: 'ladder' })}>
                    Gripper ladder
                  </button>
                )}
              </div>
            )}

            {series && (
              <section className="card" style={{ gap: 8 }}>
                <div className="row-between" style={{ alignItems: 'flex-end' }}>
                  <div className="row-text">
                    <span className="muted tiny">{METRIC_LABEL[series.metric]}</span>
                    <span className="num" style={{ fontSize: 28 }}>
                      {points.length > 0 ? format(points[points.length - 1]!.value) : '–'}
                    </span>
                  </div>
                  {points.length > 1 && (
                    <span className={`small ${delta > 0 ? 'mint' : 'muted'}`} style={{ fontWeight: 600, paddingBottom: 4 }}>
                      {delta > 0 ? `+${format(delta)} ${since}` : delta < 0 ? `${format(delta)} ${since}` : `Holding steady ${since}`}
                    </span>
                  )}
                </div>
                {points.length > 0 ? (
                  <>
                    <Chart points={points} format={format} />
                    <div className="chart-axis">
                      {axisLabels(points).map((l, k) => (
                        <span key={k}>{l}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="muted small">Not logged in this range. Try All.</p>
                )}
              </section>
            )}

            <div className="row-between" style={{ paddingTop: 2 }}>
              <h2 className="card-title">Workouts</h2>
              {sessions.length > 3 && (
                <button type="button" className="btn btn-text soft-coral" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show less' : 'See all'}
                </button>
              )}
            </div>
            {(showAll ? sessions : sessions.slice(0, 3)).map((s) => {
              const st = sessionStats(s);
              const prs = detectPRs(data.sessions, s).length;
              return (
                <button key={s.id} type="button" className="card card-tight" onClick={() => nav.go({ name: 'session', id: s.id })}>
                  <span className="row-between">
                    <span className="row-text">
                      <span className="row-name">
                        {formatDate(s.finishedAt)} · {dayName(s.dayIndex)}
                      </span>
                      <span className="muted tiny">
                        {plural(st.sets, 'set')} · {formatSeconds(st.durationSec)}
                        {s.endedForPain ? ' · stopped for pain' : ''}
                      </span>
                    </span>
                    {prs > 0 && <span className="tag tag-gold">{plural(prs, 'record')}</span>}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </main>
    </>
  );
}
