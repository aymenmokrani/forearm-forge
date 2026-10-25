import { useMemo, useState } from 'react';
import { EquipGlyph, Icon } from '../components/Icon';
import { Chip, Modal } from '../components/ui';
import { EQUIPMENT_LABEL, getExercise } from '../domain/exercises';
import { availablePool, dayName, generateProgram } from '../domain/generator';
import { EXPERIENCE_LABEL, GOAL_RULES, SAFETY_FLAGS } from '../domain/goals';
import { EQUIPMENT, EXPERIENCE, GOALS, type Equipment, type Experience, type Goal, type Profile } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';

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
    mode === 'first' && !data.disclaimerAccepted
      ? ['welcome', 'equipment', 'goal', 'details', 'preview']
      : ['equipment', 'goal', 'details', 'preview'];

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

  const createdAt = existing?.createdAt;
  const profile = useMemo<Profile | null>(
    () =>
      goal
        ? { equipment, goal, experience, daysPerWeek: days, createdAt: createdAt ?? new Date().toISOString() }
        : null,
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

  return (
    <div className="app onboarding">
      <header className="ob-head">
        {idx > 0 || mode === 'edit' ? (
          <button type="button" className="icon-btn" onClick={prev} aria-label="Back">
            <Icon name="left" />
          </button>
        ) : (
          <span className="topbar-spacer" />
        )}
        <div className="ob-dots" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1}>
          {steps.map((s, i) => (
            <span key={s} className={`ob-dot ${i <= idx ? 'ob-dot-on' : ''}`} />
          ))}
        </div>
        <span className="topbar-spacer" />
      </header>

      <main className="ob-body">
        {step === 'welcome' && (
          <section>
            <p className="eyebrow">ForearmForge</p>
            <h1 className="display">Forge grip that doesn't quit.</h1>
            <p className="lede">
              One app for every forearm goal: crushing strength, bigger forearms, all-day endurance, healthy wrists or
              climbing. Train with whatever you own, even nothing at all.
            </p>
            <div className="card safety-card">
              <h2 className="card-title">
                <Icon name="alert" size={18} /> Before you start
              </h2>
              <p>
                This app gives general training information, not medical advice. Tendons adapt slower than muscles, so
                build up gradually. Stop and see a professional if you notice:
              </p>
              <ul className="flags">
                {SAFETY_FLAGS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <label className="check">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>I understand and I'm training at my own risk.</span>
              </label>
            </div>
          </section>
        )}

        {step === 'equipment' && (
          <section>
            <h1 className="display-sm">What do you have?</h1>
            <p className="lede">Pick everything you can use. No-equipment moves are always included.</p>
            <div className="equip-grid">
              {EQUIPMENT.map((e) => {
                const on = equipment.includes(e);
                return (
                  <button
                    key={e}
                    type="button"
                    className={`equip-tile ${on ? 'equip-on' : ''}`}
                    aria-pressed={on}
                    disabled={e === 'bodyweight'}
                    onClick={() => toggle(e)}
                  >
                    <EquipGlyph equipment={e} />
                    <span>{EQUIPMENT_LABEL[e]}</span>
                    {e === 'bodyweight' && <small>Always on</small>}
                  </button>
                );
              })}
            </div>
            <p className="muted center" aria-live="polite">
              {poolSize} exercises unlocked
            </p>
          </section>
        )}

        {step === 'goal' && (
          <section>
            <h1 className="display-sm">What's the target?</h1>
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
          </section>
        )}

        {step === 'details' && goal && (
          <section>
            <h1 className="display-sm">Dial it in</h1>
            <h2 className="label">Experience</h2>
            <div className="stack">
              {EXPERIENCE.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`option option-compact ${experience === x ? 'option-on' : ''}`}
                  aria-pressed={experience === x}
                  onClick={() => setExperience(x)}
                >
                  <span className="option-title">{x[0]!.toUpperCase() + x.slice(1)}</span>
                  <span className="option-sub">{EXPERIENCE_LABEL[x]}</span>
                </button>
              ))}
            </div>
            <h2 className="label">Training days per week</h2>
            <div className="segmented" role="radiogroup" aria-label="Days per week">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={days === n}
                  className={days === n ? 'seg-on' : ''}
                  onClick={() => setDays(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="muted">
              Recommended for {GOAL_RULES[goal].label.toLowerCase()}: {GOAL_RULES[goal].frequency}.
            </p>
            {goal === 'climbing' && experience === 'beginner' && (
              <div className="card note">
                <Icon name="alert" size={18} />
                <span>
                  Max hangs are for climbers with a year or more of consistent training. You'll start with bodyweight
                  dead hangs and grip basics.
                </span>
              </div>
            )}
          </section>
        )}

        {step === 'preview' && preview && goal && (
          <section>
            <p className="eyebrow">Your plan</p>
            <h1 className="display-sm">
              {GOAL_RULES[goal].label}, {days}× a week
            </h1>
            <div className="stack">
              {preview.days.map((d) => (
                <div className="card" key={d.index}>
                  <div className="row-between">
                    <h2 className="card-title">{dayName(d.index)}</h2>
                    <span className="muted">{d.exercises.length} exercises</span>
                  </div>
                  <ul className="plain-list">
                    {d.exercises.map((p) => (
                      <li key={p.exerciseId}>
                        {getExercise(p.exerciseId)?.name}
                        <span className="muted">
                          {' '}
                          · {p.sets}×{p.holdSec ? `${p.holdSec}s` : p.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="chips">
              <Chip tone="teal">Rest {GOAL_RULES[goal].restSec}s</Chip>
              <Chip>{GOAL_RULES[goal].effort.split(':')[0]}</Chip>
            </div>
          </section>
        )}
      </main>

      <footer className="ob-foot">
        {step === 'preview' ? (
          <button type="button" className="btn btn-primary btn-block" onClick={() => save(false)}>
            {mode === 'edit' ? 'Save & rebuild plan' : 'Start training'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={(step === 'welcome' && !accepted) || (step === 'goal' && !goal)}
            onClick={next}
          >
            Continue
          </button>
        )}
      </footer>

      {confirmActive && (
        <Modal
          title="Workout in progress"
          onClose={() => setConfirmActive(false)}
          actions={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmActive(false)}>
                Keep it
              </button>
              <button type="button" className="btn btn-danger" onClick={() => save(true)}>
                Discard & rebuild
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
