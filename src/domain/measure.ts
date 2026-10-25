import type { AppData, Measurement } from './types';

/** Forearm size is asked for this often, before training (a pump inflates it). */
export const MEASURE_EVERY_DAYS = 14;

/** "YYYY-MM-DD" in local time. */
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function latestMeasurement(ms: Measurement[]): Measurement | undefined {
  return [...ms].sort((a, b) => b.at.localeCompare(a.at))[0];
}

/** Due when never measured or the last one is two weeks old, unless dismissed today. */
export function measurementDue(data: Pick<AppData, 'measurements' | 'measureSkippedOn'>, now = new Date()): boolean {
  if (data.measureSkippedOn === localDay(now)) return false;
  const last = latestMeasurement(data.measurements);
  if (!last) return true;
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((start(now) - start(new Date(last.at))) / 86_400_000) >= MEASURE_EVERY_DAYS;
}
