import { describe, expect, it } from 'vitest';
import { generateProgram } from './generator';
import { CURRENT_SCHEMA, STORAGE_KEY, defaultData, loadData, loadDataResult, parseData, saveData } from './storage';
import type { AppData } from './types';

function memoryStore(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

const corruptKeys = (store: ReturnType<typeof memoryStore>) =>
  [...store.map.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}:corrupt:`));

const sample = (): AppData => {
  const profile = {
    equipment: ['bodyweight' as const, 'dumbbell' as const],
    goal: 'strength' as const,
    experience: 'intermediate' as const,
    daysPerWeek: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  return {
    ...defaultData(),
    profile,
    program: generateProgram(profile),
    units: 'lb',
    disclaimerAccepted: true,
    sessions: [
      {
        id: 's1',
        dayIndex: 0,
        startedAt: '2026-01-02T10:00:00.000Z',
        finishedAt: '2026-01-02T10:30:00.000Z',
        entries: [{ exerciseId: 'db-wrist-curl', sets: [{ reps: 10, weight: 12.5 }] }],
      },
    ],
  };
};

describe('storage', () => {
  it('round-trips through save and load', () => {
    const store = memoryStore();
    const data = sample();
    expect(saveData(store, data)).toBe(true);
    expect(loadData(store)).toEqual(data);
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadData(memoryStore())).toEqual(defaultData());
  });

  it('backs up corrupt payloads instead of discarding them', () => {
    const store = memoryStore({ [STORAGE_KEY]: '{not json' });
    expect(loadData(store)).toEqual(defaultData());
    expect(corruptKeys(store)).toHaveLength(1);
  });

  it('reports load status', () => {
    const store = memoryStore();
    expect(loadDataResult(store).status).toBe('empty');
    const data = sample();
    saveData(store, data);
    expect(loadDataResult(store)).toMatchObject({ status: 'ok', data });
  });

  it('leaves data from a newer schema untouched', () => {
    const raw = JSON.stringify({ ...sample(), schemaVersion: CURRENT_SCHEMA + 1 });
    const store = memoryStore({ [STORAGE_KEY]: raw });
    const res = loadDataResult(store);
    expect(res.status).toBe('newer');
    expect(res.data).toEqual(defaultData());
    expect(corruptKeys(store)).toHaveLength(0);
    expect(store.map.get(STORAGE_KEY)).toBe(raw);
  });

  it('keeps only the newest corrupt backup', () => {
    const store = memoryStore({ [STORAGE_KEY]: '{not json', [`${STORAGE_KEY}:corrupt:1`]: 'old', [`${STORAGE_KEY}:corrupt:2`]: 'older' });
    const res = loadDataResult(store);
    expect(res).toMatchObject({ status: 'unreadable', backedUp: true });
    const keys = corruptKeys(store);
    expect(keys).toHaveLength(1);
    expect(store.map.get(keys[0]!)).toBe('{not json');
    expect(store.map.get(STORAGE_KEY)).toBe('{not json');
  });

  it('flags an unreadable payload it could not back up', () => {
    const map = new Map([[STORAGE_KEY, '{not json']]);
    const full = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(loadDataResult(full)).toMatchObject({ status: 'unreadable', backedUp: false, raw: '{not json' });
  });

  it('rejects payloads that are not ForearmForge data', () => {
    expect(parseData('{"hello":"world"}')).toBeNull();
    expect(parseData('[]')).toBeNull();
    expect(parseData('{"schemaVersion":2,"sessions":[]}')).toBeNull();
  });

  it('drops malformed sessions but keeps the good ones', () => {
    const data = sample();
    const raw = JSON.stringify({ ...data, sessions: [...data.sessions, { id: 7 }, { id: 'x', entries: 'nope' }] });
    expect(parseData(raw)?.sessions).toEqual(data.sessions);
  });

  it('nulls an invalid profile rather than trusting it', () => {
    const raw = JSON.stringify({ ...sample(), profile: { equipment: ['laser'], goal: 'strength' } });
    expect(parseData(raw)?.profile).toBeNull();
  });

  it('drops duplicate session ids', () => {
    const data = sample();
    const raw = JSON.stringify({ ...data, sessions: [...data.sessions, ...data.sessions] });
    expect(parseData(raw)?.sessions).toHaveLength(1);
  });

  it('rejects sessions and plans that would crash screens', () => {
    const data = sample();
    const s = data.sessions[0]!;
    const badSessions = [
      { ...s, id: 'a', dayIndex: -5 },
      { ...s, id: 'b', dayIndex: 1.5 },
      { ...s, id: 'c', finishedAt: 'not a date' },
    ];
    expect(parseData(JSON.stringify({ ...data, sessions: badSessions }))?.sessions).toEqual([]);

    const day = data.program!.days[0]!;
    const hugeSets = { ...data.program, days: [{ ...day, exercises: [{ ...day.exercises[0], sets: 1e9 }] }] };
    const badHold = { ...data.program, days: [{ ...day, exercises: [{ exerciseId: 'x', sets: 3, restSec: 60, holdSec: 'long' }] }] };
    const wrongIndex = { ...data.program, days: [{ ...day, index: 3 }] };
    for (const program of [hugeSets, badHold, wrongIndex]) {
      expect(parseData(JSON.stringify({ ...data, program }))?.program).toBeNull();
    }
  });

  it('drops an inconsistent in-progress workout', () => {
    const data = sample();
    const plan = data.program!.days[0]!.exercises;
    const active = { id: 'w', dayIndex: 0, startedAt: '2026-01-02T10:00:00.000Z', plan, entries: plan.map((p) => ({ exerciseId: p.exerciseId, sets: [] })), cursor: 0 };
    expect(parseData(JSON.stringify({ ...data, active }))?.active).toEqual(active);
    for (const bad of [{ ...active, cursor: -1 }, { ...active, cursor: 1.5 }, { ...active, plan: [] }, { ...active, entries: [] }]) {
      expect(parseData(JSON.stringify({ ...data, active: bad }))?.active).toBeNull();
    }
  });

  it('survives storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadData(throwing)).toEqual(defaultData());
    expect(saveData(throwing, sample())).toBe(false);
  });
});
