/**
 * Small synthesized sound set ("Pulse"): sporty clicks and bright rising notes.
 * Used sparingly: timer ticks, set logged, timer finished, workout finished, record.
 * Nothing plays on taps or navigation.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    // iOS/Safari: follow the silent switch and mix with the user's music instead of stopping it.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'ambient') session.type = 'ambient';
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, vol: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function click(c: AudioContext, at: number, dur: number, vol: number, freq: number) {
  const n = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, n, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 4;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 3;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(at);
}

const play = (fn: (c: AudioContext, t: number) => void) => {
  const c = audio();
  if (!c) return;
  try {
    fn(c, c.currentTime + 0.01);
  } catch {
    /* audio unavailable */
  }
};

export const sfx = {
  /** One second passing during a hold. */
  tick: () =>
    play((c, t) => {
      click(c, t, 0.03, 0.4, 3200);
      tone(c, 1800, t, 0.03, 0.03);
    }),
  /** Get-ready countdown and the last 3 seconds of a hold or rest. */
  lastTick: () =>
    play((c, t) => {
      click(c, t, 0.04, 0.55, 2600);
      tone(c, 1320, t, 0.08, 0.05);
    }),
  setLogged: () =>
    play((c, t) => {
      tone(c, 660, t, 0.08, 0.05);
      tone(c, 990, t + 0.07, 0.12, 0.05);
    }),
  timerDone: () => play((c, t) => [660, 880, 1175].forEach((f, k) => tone(c, f, t + k * 0.11, 0.22, 0.05))),
  record: () => play((c, t) => [784, 988, 1175, 1568].forEach((f, k) => tone(c, f, t + k * 0.09, 0.3, 0.045))),
  workoutDone: () =>
    play((c, t) => {
      [523, 659, 784].forEach((f) => tone(c, f, t, 0.5, 0.025));
      tone(c, 1047, t + 0.18, 0.6, 0.04);
    }),
};
