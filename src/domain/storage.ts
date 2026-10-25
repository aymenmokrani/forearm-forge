import { CLOSES, EQUIPMENT, EXPERIENCE, GOALS, GRIPPER_IDS, type AppData, type Measurement } from './types';

export const STORAGE_KEY = 'forearmforge:v1';
const CORRUPT_PREFIX = `${STORAGE_KEY}:corrupt:`;

/** Schema this build reads and writes. Bump it together with a MIGRATIONS entry. */
export const CURRENT_SCHEMA = 1;

/**
 * MIGRATIONS[n] upgrades a raw version-n payload to version n + 1 (and must set
 * schemaVersion). parseData runs them in order before validating, so older
 * backups keep loading after a schema change.
 */
const MIGRATIONS: Record<number, (v: Record<string, unknown>) => Record<string, unknown>> = {};

export function defaultData(): AppData {
  return {
    schemaVersion: 1,
    profile: null,
    program: null,
    sessions: [],
    active: null,
    units: 'kg',
    disclaimerAccepted: false,
    measurements: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const optNum = (v: unknown, max = 100_000) => v === undefined || (isNum(v) && v >= 0 && v <= max);
const isDate = (v: unknown): v is string => isStr(v) && Number.isFinite(Date.parse(v));

function validSets(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length <= 100 &&
    v.every(
      (s) =>
        isObj(s) &&
        optNum(s.reps, 10_000) &&
        optNum(s.weight, 10_000) &&
        optNum(s.seconds, 86_400) &&
        (s.gripper === undefined || (GRIPPER_IDS as readonly unknown[]).includes(s.gripper)) &&
        (s.close === undefined || (CLOSES as readonly unknown[]).includes(s.close)),
    )
  );
}

function validEntries(v: unknown): boolean {
  return Array.isArray(v) && v.every((e) => isObj(e) && isStr(e.exerciseId) && validSets(e.sets));
}

function validProfile(v: unknown): boolean {
  return (
    isObj(v) &&
    Array.isArray(v.equipment) &&
    v.equipment.every((e) => (EQUIPMENT as readonly unknown[]).includes(e)) &&
    (GOALS as readonly unknown[]).includes(v.goal) &&
    (EXPERIENCE as readonly unknown[]).includes(v.experience) &&
    isInt(v.daysPerWeek, 1, 7) &&
    isStr(v.createdAt)
  );
}

function validPlan(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.length <= 20 &&
    v.every(
      (p) =>
        isObj(p) &&
        isStr(p.exerciseId) &&
        isInt(p.sets, 1, 20) &&
        isInt(p.restSec, 0, 3600) &&
        optNum(p.reps, 1000) &&
        optNum(p.holdSec, 3600) &&
        (p.reps !== undefined || p.holdSec !== undefined),
    )
  );
}

function validProgram(v: unknown): boolean {
  return (
    isObj(v) &&
    (GOALS as readonly unknown[]).includes(v.goal) &&
    Array.isArray(v.days) &&
    v.days.length > 0 &&
    v.days.length <= 7 &&
    v.days.every((d, i) => isObj(d) && d.index === i && Array.isArray(d.focus) && validPlan(d.exercises))
  );
}

function validActive(v: unknown): boolean {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isDate(v.startedAt) &&
    (v.lastSetAt === undefined || isDate(v.lastSetAt)) &&
    isInt(v.dayIndex, 0, 6) &&
    validPlan(v.plan) &&
    validEntries(v.entries) &&
    Array.isArray(v.plan) &&
    Array.isArray(v.entries) &&
    v.entries.length === v.plan.length &&
    isInt(v.cursor, 0, v.plan.length - 1)
  );
}

const validMeasurement = (m: unknown): m is Measurement =>
  isObj(m) && isDate(m.at) && isNum(m.left) && isNum(m.right) && m.left > 0 && m.left < 100 && m.right > 0 && m.right < 100;

/**
 * Parses and validates persisted or imported JSON. Returns null when the payload
 * is not a usable ForearmForge backup. Malformed sessions are dropped rather than
 * failing the whole load, so one bad record can't wipe a training history.
 */
export function parseData(raw: string): AppData | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(v) || !isInt(v.schemaVersion, 1, CURRENT_SCHEMA)) return null;
  for (let ver = v.schemaVersion; ver < CURRENT_SCHEMA; ver++) {
    const migrate = MIGRATIONS[ver];
    if (!migrate) return null;
    v = migrate(v as Record<string, unknown>);
    if (!isObj(v)) return null;
  }
  if (!Array.isArray(v.sessions)) return null;
  const base = defaultData();
  const seen = new Set<string>();
  const sessions = v.sessions.filter((s): s is AppData['sessions'][number] => {
    const ok =
      isObj(s) &&
      isStr(s.id) &&
      !seen.has(s.id) &&
      isInt(s.dayIndex, 0, 6) &&
      isDate(s.startedAt) &&
      isDate(s.finishedAt) &&
      validEntries(s.entries);
    if (ok) seen.add(s.id as string);
    return ok;
  });
  return {
    ...base,
    profile: validProfile(v.profile) ? (v.profile as unknown as AppData['profile']) : null,
    program: validProgram(v.program) ? (v.program as unknown as AppData['program']) : null,
    sessions,
    active: validActive(v.active) ? (v.active as unknown as AppData['active']) : null,
    units: v.units === 'lb' ? 'lb' : 'kg',
    disclaimerAccepted: v.disclaimerAccepted === true,
    measurements: Array.isArray(v.measurements) ? v.measurements.filter(validMeasurement) : [],
    ...(v.soundOff === true ? { soundOff: true } : {}),
    ...(isStr(v.measureSkippedOn) && /^\d{4}-\d{2}-\d{2}$/.test(v.measureSkippedOn) ? { measureSkippedOn: v.measureSkippedOn } : {}),
  };
}

/** True when the payload was written by a newer build; it must be left untouched. */
export function isNewerSchema(raw: string): boolean {
  try {
    const v: unknown = JSON.parse(raw);
    return isObj(v) && isNum(v.schemaVersion) && v.schemaVersion > CURRENT_SCHEMA;
  } catch {
    return false;
  }
}

interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  // Optional so plain stand-ins work; needed to prune old corrupt backups.
  removeItem?(key: string): void;
  key?(index: number): string | null;
  readonly length?: number;
}

/**
 * Copies an unreadable payload to a `:corrupt:` key, keeping only the newest
 * such backup. Returns false when the copy could not be written.
 */
export function backupCorrupt(store: KV, raw: string): boolean {
  const key = `${CORRUPT_PREFIX}${Date.now()}`;
  try {
    store.setItem(key, raw);
  } catch {
    return false; // storage full; nothing more we can do
  }
  try {
    if (store.key && store.removeItem && store.length !== undefined) {
      const stale: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k !== key && k.startsWith(CORRUPT_PREFIX)) stale.push(k);
      }
      stale.forEach((k) => store.removeItem!(k));
    }
  } catch {
    /* pruning is best-effort */
  }
  return true;
}

/**
 * ok: parsed stored data. empty: nothing stored. newer: written by a newer build
 * (left as is). unreadable: present but unusable; backedUp says whether a
 * `:corrupt:` copy exists, i.e. whether overwriting it is safe.
 */
export type LoadStatus = 'ok' | 'empty' | 'unreadable' | 'newer';
export interface LoadResult {
  data: AppData;
  status: LoadStatus;
  backedUp: boolean;
  raw: string | null;
}

export function loadDataResult(store: KV): LoadResult {
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { data: defaultData(), status: 'unreadable', backedUp: false, raw: null };
  }
  if (raw === null) return { data: defaultData(), status: 'empty', backedUp: false, raw };
  const parsed = parseData(raw);
  if (parsed) return { data: parsed, status: 'ok', backedUp: false, raw };
  if (isNewerSchema(raw)) return { data: defaultData(), status: 'newer', backedUp: false, raw };
  // Keep the unreadable payload around instead of silently destroying it.
  return { data: defaultData(), status: 'unreadable', backedUp: backupCorrupt(store, raw), raw };
}

export function loadData(store: KV): AppData {
  return loadDataResult(store).data;
}

export function saveData(store: KV, data: AppData): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
