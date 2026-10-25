import type { Units } from './types';

const LB_PER_KG = 2.20462;

export const toDisplay = (kg: number, units: Units) => round1(units === 'kg' ? kg : kg * LB_PER_KG);
export const fromDisplay = (value: number, units: Units) => (units === 'kg' ? value : value / LB_PER_KG);
export const weightStep = (units: Units) => (units === 'kg' ? 1 : 2.5);
export const formatWeight = (kg: number, units: Units) => `${toDisplay(kg, units)} ${units}`;

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}
