import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Block, Huge, Modal, RoundButton, StepDots } from '../components/ui';
import { EQUIPMENT_LABEL, EXERCISES, getExercise } from '../domain/exercises';
import { availablePool, dayName, generateProgram } from '../domain/generator';
import { EXPERIENCE_LABEL, GOAL_RULES, SAFETY_FLAGS } from '../domain/goals';
import { EQUIPMENT, EXPERIENCE, GOALS, type Equipment, type Experience, type Goal, type Profile } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';
import { plural } from './common';

const RECOMMENDED_DAYS: Record<Goal, number> = {
  strength: 3,
  hypertrophy: 3,
  endurance: 3,
  'wrist-health': 4,
  climbing: 2,
};

type Step = 'welcome' | 'equipment' | 'goal' | 'details' | 'preview';

export function Onboarding({ mode }: { mode: 'first' | 'edit' }) {
  const { data, update } = useStore();
  const nav = useNav();
  const existing = data.profile;
  const steps: Step[] =
    mode === 'first' && !data.disclaimerAccepted ? ['welcome', 'equipment', 'goal', 'details', 'preview'] : ['equipment', 'goal', 'details', 'preview'];

  const [step, setStep] = useState<Step>(steps[0]!);
  const [accepted, setAccepted] = useState(data.disclaimerAccepted);
  const [equipment, setEquipment] = useState<Equipment[]>(existing?.equipment ?? ['bodyweight']);
  const [goal, setGoal] = useState<Goal | null>(existing?.goal ?? null);
  const [experience, setExperience] = useState<Experience>(existing?.experience ?? 'beginner');
  const [days, setDays] = useState(existing?.daysPerWeek ?? 3);
  const [confirmActive, setConfirmActive] = useState(false);

  const idx = steps.indexOf(step);
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]!);
  const prev = () => (idx === 0 ? nav.back() : setStep(steps[idx - 1]!));
  const canGoBack = idx > 0 || mode === 'edit';
  const blocked = (step === 'welcome' && !accepted) || (step === 'goal' && !goal);
  const hintId = useId();

  // A new step is a new screen for screen readers: start them at its heading.
  const screen = useRef<HTMLDivElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    const heading = screen.current?.querySelector<HTMLElement>('h1');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [step]);

  const createdAt = existing?.createdAt;
  const profile = useMemo<Profile | null>(
    () => (goal ? { equipment, goal, experience, daysPerWeek: days, createdAt: createdAt ?? new Date().toISOString() } : null),
    [equipment, goal, experience, days, createdAt],
  );
  const preview = useMemo(() => (profile ? generateProgram(profile) : null), [profile]);
  const poolSize = availablePool({ equipment, goal: 'hypertrophy', experience: 'advanced' }).length;

  const toggle = (e: Equipment) => {
    if (e === 'bodyweight') return;
    setEquipment((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  };

  const save = (discardActive: boolean) => {
    if (!profile || !preview) return;
    if (data.active && !discardActive) {
      setConfirmActive(true);
      return;
    }
    update((d) => ({ ...d, profile, program: preview, disclaimerAccepted: true, active: discardActive ? null : d.active }));
    if (mode === 'edit') nav.back();
    else nav.tab('today');
  };

  const topRow = (
    <div className="row" style={{ gap: 14, minHeight: 44 }}>
      {canGoBack && <RoundButton icon="back" label="Back" onClick={prev} />}
      <StepDots index={idx} count={steps.length} />
    </div>
  );

  let head;
  let body;
  switch (step) {
    case 'welcome':
      head = (
        <>
          {topRow}
          <div style={{ height: 14 }} />
          <Huge value={EXERCISES.length} label="exercises" sub="for grip, wrists and forearms" size={104} />
          <h1 className="title" style={{ fontSize: 36, paddingTop: 6 }}>
            Forge a grip
            <br />
            that lasts.
          </h1>
        </>
      );
      body = (
        <>
          <p className="lede">Strength, size, endurance, healthy wrists or climbing. Train with whatever you own, even nothing at all.</p>
          <section className="card">
            <label className="check">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>I understand this is general training info, not medical advice, and I'll stop if something hurts.</span>
            </label>
            <details>
              <summary>When to stop</summary>
              <ul className="flags" role="list" style={{ marginTop: 6 }}>
                {SAFETY_FLAGS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          </section>
        </>
      );
      break;
    case 'equipment':
      head = (
        <>
          {topRow}
          <h1 className="title">What's in your kit?</h1>
          <Huge value={poolSize} label="exercises unlocked" sub="Bodyweight moves are always in." />
        </>
      );
      body = (
        <>
          <p className="muted">Tap everything you can use.</p>
          <div className="chip-grid" role="group" aria-label="Equipment">
            {EQUIPMENT.map((e) => {
              const on = equipment.includes(e);
              return (
                <button
                  key={e}
                  type="button"
                  className={`chip ${on ? 'chip-on' : ''}`}
                  aria-pressed={on}
                  aria-disabled={e === 'bodyweight' || undefined}
                  onClick={() => toggle(e)}
                  style={{ minHeight: 46 }}
                >
                  {on && <Icon name="check" size={16} />}
                  {e === 'bodyweight' ? 'Bodyweight' : EQUIPMENT_LABEL[e]}
                </button>
              );
            })}
          </div>
        </>
      );
      break;
    case 'goal':
      head = (
        <>
          {topRow}
          <h1 className="title">What's the target?</h1>
          <p className="muted small">Pick the one that matters most. You can change it any time.</p>
        </>
      );
      body = (
        <div className="stack">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              className={`option ${goal === g ? 'option-on' : ''}`}
              aria-pressed={goal === g}
              onClick={() => {
                setGoal(g);
                if (!existing) setDays(RECOMMENDED_DAYS[g]);
              }}
            >
              <span className="option-title">{GOAL_RULES[g].label}</span>
              <span className="option-sub">{GOAL_RULES[g].tagline}</span>
            </button>
          ))}
        </div>
      );
      break;
    case 'details':
      head = (
        <>
          {topRow}
          <h1 className="title">Dial it in</h1>
          <Huge value={`${days}×`} label="a week" sub={goal ? `Recommended: ${GOAL_RULES[goal].frequency}` : undefined} />
        </>
      );
      body = (
        <>
          <span className="eyebrow eyebrow-fog">Training days per week</span>
          <div className="seg seg-wide" role="radiogroup" aria-label="Days per week">
            {[2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={days === n} className={days === n ? 'seg-on' : ''} onClick={() => setDays(n)}>
                {n}
              </button>
            ))}
          </div>
          <span className="eyebrow eyebrow-fog" style={{ paddingTop: 6 }}>
            Experience
          </span>
          <div className="stack">
            {EXPERIENCE.map((x) => (
              <button
                key={x}
                type="button"
                className={`option ${experience === x ? 'option-on' : ''}`}
                aria-pressed={experience === x}
                onClick={() => setExperience(x)}
                style={{ padding: '12px 18px' }}
              >
                <span className="option-title">{x[0]!.toUpperCase() + x.slice(1)}</span>
                <span className="option-sub">{EXPERIENCE_LABEL[x]}</span>
              </button>
            ))}
          </div>
          {goal === 'climbing' && experience === 'beginner' && (
            <section className="card card-quiet">
              <p className="muted small">
                Max hangs are for climbers with a year or more of consistent training. You'll start with bodyweight dead hangs and grip basics.
              </p>
            </section>
          )}
        </>
      );
      break;
    case 'preview':
      head = (
        <>
          {topRow}
          <div className="row-text">
            <span className="eyebrow">Your plan</span>
            <h1 className="title">{goal ? GOAL_RULES[goal].label : ''}</h1>
          </div>
          <Huge value={`${days}×`} label="a week" sub={goal ? `Rest ${GOAL_RULES[goal].restSec} s · ${GOAL_RULES[goal].effort.split(':')[0]}` : undefined} />
        </>
      );
      body = (
        <div className="stack">
          {preview?.days.map((d) => (
            <section className="card" key={d.index}>
              <div className="row-between">
                <h2 className="card-title">{dayName(d.index)}</h2>
                <span className="muted tiny">{plural(d.exercises.length, 'exercise')}</span>
              </div>
              <ul role="list">
                {d.exercises.map((p) => (
                  <li key={p.exerciseId} className="row-between small" style={{ padding: '3px 0' }}>
                    <span>{getExercise(p.exerciseId)?.name}</span>
                    <span className="muted num">
                      {p.sets} × {p.holdSec ? `${p.holdSec} s` : p.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );
      break;
  }

  return (
    <div ref={screen} className="app">
      <Block tall={step === 'welcome'}>{head}</Block>
      <main className="content" style={{ gap: 14 }}>
        {body}
        <div className="push-down" style={{ paddingTop: 8 }}>
          {step === 'preview' ? (
            <button type="button" className="btn btn-primary btn-block" onClick={() => save(false)}>
              {mode === 'edit' ? 'Save and rebuild plan' : 'Start training'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary btn-block"
                aria-disabled={blocked || undefined}
                aria-describedby={blocked ? hintId : undefined}
                onClick={() => {
                  if (!blocked) next();
                }}
              >
                {step === 'welcome' ? 'Get started' : 'Continue'}
              </button>
              {blocked && (
                <span id={hintId} className="sr-only">
                  {step === 'welcome' ? 'Tick the box above first.' : 'Pick a goal first.'}
                </span>
              )}
            </>
          )}
        </div>
      </main>

      {confirmActive && (
        <Modal
          title="Workout in progress"
          onClose={() => setConfirmActive(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmActive(false)}>
                Keep it
              </button>
              <button type="button" className="btn btn-safety" onClick={() => save(true)}>
                Discard and rebuild
              </button>
            </>
          }
        >
          Rebuilding your plan discards the unfinished workout. Finish it first to keep those sets.
        </Modal>
      )}
    </div>
  );
}
