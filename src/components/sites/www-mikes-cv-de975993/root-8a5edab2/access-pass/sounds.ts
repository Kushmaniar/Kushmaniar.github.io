import type { SoundName } from "../types";

interface Envelope {
  /** Start delay relative to the sound's start (s). */
  offset?: number;
  attack: number;
  decay: number;
  peak: number;
}

export interface ToneLayer extends Envelope {
  kind: "tone";
  waveform: OscillatorType;
  freq: number;
  detune?: number;
  glideTo?: number;
  glideTime?: number;
}

export interface NoiseLayer extends Envelope {
  kind: "noise";
  filter: BiquadFilterType;
  freq: number;
  q?: number;
}

export type SoundLayer = ToneLayer | NoiseLayer;

/** Feedback delay → lowpass "shimmer" tail. */
export interface ShimmerConfig {
  delay: number;
  feedback: number;
  wet: number;
  lowpass: number;
}

export interface SoundSpec {
  masterGain: number;
  layers: readonly SoundLayer[];
  shimmer?: ShimmerConfig;
}

const tone = (
  waveform: OscillatorType,
  freq: number,
  env: Envelope,
  extra: Pick<ToneLayer, "detune" | "glideTo" | "glideTime"> = {},
): ToneLayer => ({ kind: "tone", waveform, freq, ...env, ...extra });

const noise = (filter: BiquadFilterType, freq: number, q: number, env: Envelope): NoiseLayer => ({
  kind: "noise",
  filter,
  freq,
  q,
  ...env,
});

const shimmer = (delay: number, feedback: number, wet: number, lowpass: number): ShimmerConfig => ({
  delay,
  feedback,
  wet,
  lowpass,
});

export const SOUNDS: Readonly<Record<SoundName, SoundSpec>> = {
  chime: {
    masterGain: 0.5,
    layers: [
      tone("sine", 1046.5, { attack: 0.006, decay: 0.22, peak: 0.09 }),
      tone("sine", 1568, { offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 }),
    ],
    shimmer: shimmer(0.12, 0.25, 0.18, 4000),
  },
  sparkle: {
    masterGain: 0.5,
    layers: [
      tone("sine", 1760, { attack: 0.003, decay: 0.09, peak: 0.045 }),
      tone("sine", 2217, { offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 }),
      tone("sine", 2637, { offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 }),
      tone("sine", 3520, { offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 }),
    ],
    shimmer: shimmer(0.07, 0.35, 0.22, 6000),
  },
  droplet: {
    masterGain: 0.55,
    layers: [
      tone("sine", 1200, { attack: 0.004, decay: 0.2, peak: 0.075 }, { glideTo: 550, glideTime: 0.14 }),
    ],
    shimmer: shimmer(0.09, 0.2, 0.15, 3000),
  },
  bloom: {
    masterGain: 0.5,
    layers: [
      tone("sine", 528, { attack: 0.06, decay: 0.32, peak: 0.06 }),
      tone("sine", 528, { attack: 0.06, decay: 0.34, peak: 0.05 }, { detune: 12 }),
    ],
    shimmer: shimmer(0.15, 0.2, 0.12, 2500),
  },
  whisper: {
    masterGain: 0.5,
    layers: [noise("lowpass", 1200, 0.7, { attack: 0.04, decay: 0.16, peak: 0.05 })],
  },
  tick: {
    masterGain: 0.4,
    layers: [
      noise("bandpass", 5400, 1.8, { attack: 0.001, decay: 0.018, peak: 0.14 }),
      tone("sine", 2600, { attack: 0.001, decay: 0.012, peak: 0.018 }),
    ],
  },
  press: {
    masterGain: 0.4,
    layers: [noise("bandpass", 1700, 1.4, { attack: 0.001, decay: 0.02, peak: 0.13 })],
  },
  release: {
    masterGain: 0.4,
    layers: [
      noise("bandpass", 4600, 1.8, { attack: 0.001, decay: 0.016, peak: 0.12 }),
      tone("sine", 3200, { offset: 0.006, attack: 0.001, decay: 0.05, peak: 0.02 }),
    ],
  },
  toggle: {
    masterGain: 0.4,
    layers: [
      noise("bandpass", 2200, 1.6, { attack: 0.001, decay: 0.016, peak: 0.12 }),
      noise("bandpass", 3800, 1.6, { offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 }),
    ],
  },
  success: {
    masterGain: 0.5,
    layers: [
      tone("sine", 880, { attack: 0.004, decay: 0.09, peak: 0.06 }),
      tone("sine", 1108.73, { offset: 0.06, attack: 0.004, decay: 0.1, peak: 0.06 }),
      tone("sine", 1318.51, { offset: 0.12, attack: 0.004, decay: 0.18, peak: 0.07 }),
    ],
    shimmer: shimmer(0.1, 0.22, 0.16, 4500),
  },
  error: {
    masterGain: 0.42,
    layers: [
      noise("bandpass", 850, 1.1, { attack: 0.001, decay: 0.035, peak: 0.13 }),
      tone("triangle", 440, { offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 }),
      tone("triangle", 349.23, { offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 }),
    ],
  },
  page: {
    masterGain: 0.38,
    layers: [
      noise("lowpass", 1800, 0.7, { attack: 0.006, decay: 0.08, peak: 0.11 }),
      noise("bandpass", 4200, 1.2, { offset: 0.04, attack: 0.004, decay: 0.065, peak: 0.08 }),
      tone("sine", 2400, { offset: 0.075, attack: 0.002, decay: 0.045, peak: 0.02 }),
    ],
  },
  loading: {
    masterGain: 0.42,
    layers: [
      noise("lowpass", 1400, 0.6, { attack: 0.035, decay: 0.14, peak: 0.035 }),
      tone("sine", 420, { attack: 0.025, decay: 0.18, peak: 0.05 }, { glideTo: 630, glideTime: 0.18 }),
    ],
    shimmer: shimmer(0.11, 0.18, 0.12, 2800),
  },
  ready: {
    masterGain: 0.45,
    layers: [
      noise("bandpass", 3200, 1.7, { attack: 0.001, decay: 0.018, peak: 0.1 }),
      tone("sine", 659.25, { offset: 0.025, attack: 0.012, decay: 0.2, peak: 0.05 }),
      tone("sine", 987.77, { offset: 0.025, attack: 0.012, decay: 0.22, peak: 0.035 }),
    ],
    shimmer: shimmer(0.13, 0.2, 0.13, 3600),
  },
};

/** Extra stop time after each voice's envelope. */
const TAIL = 0.05;
/** Slack before tearing the graph down. */
const END_PAD = 0.05;
/** Level at which a shimmer echo counts as inaudible. */
const SILENCE = 0.001;

/** 1e-4 → peak → 1e-4 exponential gain envelope starting at t0. */
function envelopeGain(ctx: AudioContext, L: Envelope, t0: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1e-4, t0);
  gain.gain.exponentialRampToValueAtTime(L.peak, t0 + L.attack);
  gain.gain.exponentialRampToValueAtTime(1e-4, t0 + L.attack + L.decay);
  return gain;
}

function playTone(ctx: AudioContext, dest: AudioNode, L: ToneLayer, t0: number): void {
  const osc = ctx.createOscillator();
  osc.type = L.waveform;
  osc.frequency.setValueAtTime(L.freq, t0);
  if (L.detune !== undefined) osc.detune.value = L.detune;
  if (L.glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(L.glideTo, t0 + (L.glideTime ?? L.attack + L.decay));
  }
  const gain = envelopeGain(ctx, L, t0);
  osc.connect(gain).connect(dest);
  osc.start(t0);
  osc.stop(t0 + L.attack + L.decay + TAIL);
}

function playNoise(ctx: AudioContext, dest: AudioNode, L: NoiseLayer, t0: number): void {
  const dur = L.attack + L.decay + TAIL;
  const frames = Math.max(1, Math.floor(dur * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = 2 * Math.random() - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = L.filter;
  filter.frequency.value = L.freq;
  if (L.q !== undefined) filter.Q.value = L.q;
  const gain = envelopeGain(ctx, L, t0);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t0);
  src.stop(t0 + dur);
}

function connectShimmer(
  ctx: AudioContext,
  input: AudioNode,
  output: AudioNode,
  cfg: ShimmerConfig,
): AudioNode[] {
  const delay = ctx.createDelay(1);
  delay.delayTime.value = cfg.delay;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = cfg.lowpass;
  const feedback = ctx.createGain();
  feedback.gain.value = cfg.feedback;
  const wet = ctx.createGain();
  wet.gain.value = cfg.wet;

  input.connect(delay);
  delay.connect(lowpass);
  lowpass.connect(feedback);
  feedback.connect(delay);
  lowpass.connect(wet);
  wet.connect(output);
  return [delay, lowpass, feedback, wet];
}

/** How long the shimmer keeps echoing above SILENCE. */
function shimmerTail(cfg: ShimmerConfig | undefined): number {
  if (!cfg || cfg.feedback <= 0) return 0;
  if (cfg.feedback >= 1) return cfg.delay;
  return cfg.delay * (1 + Math.ceil(Math.log(SILENCE) / Math.log(cfg.feedback)));
}

function render(ctx: AudioContext, s: SoundSpec): void {
  const master = ctx.createGain();
  master.gain.value = s.masterGain;
  master.connect(ctx.destination);
  const nodes = s.shimmer ? connectShimmer(ctx, master, ctx.destination, s.shimmer) : [];

  let voiceLen = 0;
  for (const L of s.layers) {
    const offset = L.offset ?? 0;
    const t0 = ctx.currentTime + offset;
    if (L.kind === "tone") playTone(ctx, master, L, t0);
    else playNoise(ctx, master, L, t0);
    voiceLen = Math.max(voiceLen, offset + L.attack + L.decay + TAIL);
  }

  const lifetime = voiceLen + shimmerTail(s.shimmer) + END_PAD;
  window.setTimeout(() => {
    master.disconnect();
    for (const node of nodes) node.disconnect();
  }, lifetime * 1000);
}

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

/** The shared AudioContext, created on first use; null when WebAudio is unavailable. */
function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const w = window as AudioWindow;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

const isRunning = (ctx: AudioContext) => ctx.state === "running";

/** Play a synthesized UI sound. Silently no-ops before the first user gesture. */
export function playSound(name: SoundName = "chime"): void {
  if (typeof window === "undefined") return;
  if (!Object.prototype.hasOwnProperty.call(SOUNDS, name)) return;
  if (navigator.userActivation?.hasBeenActive === false) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const s = SOUNDS[name];

  if (isRunning(ctx)) {
    render(ctx, s);
    return;
  }
  try {
    ctx.resume().then(
      () => {
        if (isRunning(ctx)) render(ctx, s);
      },
      () => {},
    );
  } catch {
    // resume() unsupported or throwing synchronously: stay silent.
  }
}
