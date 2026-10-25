import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './exercises';
import { GUIDES } from './guide';

describe('exercise guides', () => {
  it('covers every exercise with steps and both tips, and nothing else', () => {
    expect(Object.keys(GUIDES).sort()).toEqual(EXERCISES.map((e) => e.id).sort());
    for (const [id, g] of Object.entries(GUIDES)) {
      expect(g.steps.length, id).toBeGreaterThanOrEqual(2);
      expect(g.do.length && g.avoid.length, id).toBeTruthy();
    }
  });

  it('only references photo frames that are bundled', () => {
    for (const [id, g] of Object.entries(GUIDES)) {
      g.photos?.frames.forEach((_, k) => {
        expect(existsSync(join(__dirname, '..', 'photos', `${g.photos!.set}-${k}.jpg`)), `${id} frame ${k}`).toBe(true);
      });
    }
  });
});
