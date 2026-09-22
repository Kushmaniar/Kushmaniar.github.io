# PassKit (gate utilities) Specification

## Overview
- **Target files** (stubs exist — keep every exported name/signature): `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/access-pass/sounds.ts`, `textures.ts`, `cardMaterials.ts`
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/gate-desktop-1440.png` (READY LCD, cream plastic), `gate-reading.png` (SUCCESS LCD green)
- **Interaction model:** N/A (library code used by BoardingPass/CardReader)

## sounds.ts — WebAudio synth (`export function playSound(name: SoundName = "chime"): void`, also `export const SOUNDS`)
Sound table (verbatim; `offset` defaults 0):
```
chime   gain .5  [tone sine 1046.5 a.006 d.22 p.09] [tone sine 1568 off.09 a.006 d.26 p.08]            shimmer {delay .12 fb .25 wet .18 lp 4000}
sparkle gain .5  [tone sine 1760 a.003 d.09 p.045] [tone sine 2217 off.045 a.003 d.09 p.04] [tone sine 2637 off.09 a.003 d.1 p.038] [tone sine 3520 off.135 a.003 d.12 p.032]  shimmer {.07 .35 .22 6000}
droplet gain .55 [tone sine 1200 glideTo 550 glideTime .14 a.004 d.2 p.075]                            shimmer {.09 .2 .15 3000}
bloom   gain .5  [tone sine 528 a.06 d.32 p.06] [tone sine 528 detune 12 a.06 d.34 p.05]              shimmer {.15 .2 .12 2500}
whisper gain .5  [noise lowpass 1200 Q.7 a.04 d.16 p.05]
tick    gain .4  [noise bandpass 5400 Q1.8 a.001 d.018 p.14] [tone sine 2600 a.001 d.012 p.018]
press   gain .4  [noise bandpass 1700 Q1.4 a.001 d.02 p.13]
release gain .4  [noise bandpass 4600 Q1.8 a.001 d.016 p.12] [tone sine 3200 off.006 a.001 d.05 p.02]
toggle  gain .4  [noise bandpass 2200 Q1.6 a.001 d.016 p.12] [noise bandpass 3800 Q1.6 off.024 a.001 d.02 p.1]
success gain .5  [tone sine 880 a.004 d.09 p.06] [tone sine 1108.73 off.06 a.004 d.1 p.06] [tone sine 1318.51 off.12 a.004 d.18 p.07]  shimmer {.1 .22 .16 4500}
error   gain .42 [noise bandpass 850 Q1.1 a.001 d.035 p.13] [tone triangle 440 off.025 a.004 d.09 p.045] [tone triangle 349.23 off.1 a.004 d.14 p.04]
page    gain .38 [noise lowpass 1800 Q.7 a.006 d.08 p.11] [noise bandpass 4200 Q1.2 off.04 a.004 d.065 p.08] [tone sine 2400 off.075 a.002 d.045 p.02]
loading gain .42 [noise lowpass 1400 Q.6 a.035 d.14 p.035] [tone sine 420 glideTo 630 glideTime .18 a.025 d.18 p.05]  shimmer {.11 .18 .12 2800}
ready   gain .45 [noise bandpass 3200 Q1.7 a.001 d.018 p.1] [tone sine 659.25 off.025 a.012 d.2 p.05] [tone sine 987.77 off.025 a.012 d.22 p.035]  shimmer {.13 .2 .13 3600}
```
Engine (TAIL = .05, END_PAD = .05, SILENCE = .001):
- tone(ctx, dest, L, t0): OscillatorNode type/frequency.setValueAtTime(freq, t0); detune.value if set; glideTo → frequency.exponentialRampToValueAtTime(glideTo, t0 + (glideTime ?? attack + decay)). Gain: setValueAtTime(1e-4, t0) → exponentialRamp(peak, t0 + attack) → exponentialRamp(1e-4, t0 + attack + decay). osc→gain→dest; start t0; stop t0 + attack + decay + TAIL.
- noise(ctx, dest, L, t0): dur = attack + decay + TAIL; mono buffer `max(1, floor(dur * sampleRate))` frames of `2*Math.random()-1`; BufferSource → BiquadFilter (type, frequency, Q if set) → gain envelope as above → dest; start t0; stop t0 + dur.
- shimmer(ctx, input, output, cfg): DelayNode(max 1) delayTime=cfg.delay; lowpass BiquadFilter freq=cfg.lowpass; feedback Gain=cfg.feedback; wet Gain=cfg.wet; input→delay→lowpass→feedback→delay; lowpass→wet→output. Return the 4 nodes.
- render(ctx, s): master Gain = s.masterGain → destination; nodes = s.shimmer ? shimmer(ctx, master, destination, s.shimmer) : []; each layer at `ctx.currentTime + offset` (tone or noise into master). After `(voiceLen + tailLen + END_PAD) * 1000` ms disconnect master and nodes. voiceLen = max over layers of offset+attack+decay+TAIL; tailLen = !shimmer || fb ≤ 0 ? 0 : fb ≥ 1 ? delay : delay * (1 + ceil(log(SILENCE)/log(fb))).
- playSound(name): return if name not in table, or `navigator.userActivation?.hasBeenActive === false`. Lazily create one AudioContext (`window.AudioContext ?? webkitAudioContext`, null on failure). If `state === "running"` render; else `ctx.resume().then(() => ctx.state === "running" && render(...), () => {})` inside try/catch.

## textures.ts (exports: LCD_FONT, useGrainTexture, useBrushedTexture, useLcdTextures, usePassTextures)
Put canvas drawing in plain factory functions (Math.random is fine there) and call them from `useMemo`/lazy `useState`.
- `makeGrain(color, specks)`: 256² canvas; fill `color`; 16 blotches: centre random*256, radius random*70+45, radialGradient stop0 `rgba(172, 140, 74, ${random*.035+.012})` → stop1 `rgba(172, 140, 74, 0)`, arc fill; then `specks` dots: fill `rgba(100, 90, 64, ${random*.1+.035})`, radius random*1.1+.3, random position. CanvasTexture, colorSpace SRGBColorSpace. `useGrainTexture = useMemo(..., [color, specks])`.
- `makeBrushed(rx, ry)`: 512² canvas fill `rgb(199,199,199)`; 256² ImageData noise, each pixel grey = 199 + (random-.5)*20, alpha 255, drawn scaled to 512² at globalAlpha .4; lineCap round. stroke(len, spread, width, alpha): p = (random*512, random*512), a = (random-.5)*spread, d = (cos a·len, sin a·len); lineWidth = width; strokeStyle `rgba(${random < .55 ? "255,255,255" : "90,90,90"}, ${alpha})`; draw the segment at offsets (0,0), (-512,0), (0,-512) for seamless wrap. Do 420× stroke(14+random*90, .5, .9+random*.9, random*.34+.14); 46× stroke(120+random*320, .22, 1.2, random*.2+.08); 16× stroke(5+random*20, 2.4, 2.2, random*.3+.25). CanvasTexture; wrapS=wrapT=RepeatWrapping; repeat.set(rx, ry); anisotropy 8 (no colorSpace — data texture).
- `LCD_FONT = '400 62px "MB LCD", "MB Mono", ui-monospace, monospace'` (already in stub).
- `makeLcd(text, color)` → { tex, draw }: 512×128 canvas, CanvasTexture colorSpace SRGB. draw(): clear; fill `#0d0f0d`; scanlines: fill `rgba(255,255,255,0.025)`, `fillRect(0, y, 512, 1)` for y = 0,4,…,124; font LCD_FONT; letterSpacing "8px"; textAlign center; textBaseline middle; shadowColor = color; shadowBlur 16; fillStyle = color; fillText(text, 262, 70); tex.needsUpdate = true. Call draw() once on creation.
- `useLcdTextures()`: create once (lazy useState): idle "READY" #7d857c, near "READING" #d9a013, error "ERROR" #e0483a, granted "SUCCESS" #35c56d. Effect: `document.fonts?.load(LCD_FONT).catch(()=>{}).then(() => document.fonts.ready)` → redraw all four unless unmounted. Return `Record<ReaderStatus, CanvasTexture>` (stable object).
- `usePassTextures()`: useMemo; load(url, mirror) = TextureLoader().load(url); colorSpace SRGB; anisotropy 16; if mirror: wrapS = RepeatWrapping, repeat.x = -1. front = asset("/folio/boarding-pass.png"), back = asset("/folio/boarding-pass-back.png") mirrored. (`asset` from `../config`.)

## cardMaterials.ts (exports: CardUniforms, createCardMaterial, createCardDepthMaterial)
- `createCardMaterial(params, uniforms)`: `m = new MeshStandardMaterial({ transparent: true, ...params })`; `m.onBeforeCompile = (shader) => { Object.assign(shader.uniforms, uniforms); … }` with string replacements:
  - vertex `#include <common>` → `#include <common>\nuniform float uCurve; uniform float uSlant; uniform float uHalfW;\nvarying vec2 vCardXY;`
  - vertex `#include <beginnormal_vertex>` → `float _nx = position.x / uHalfW;\nfloat _ddx = 2.0 * uCurve * _nx + uSlant;\nvec3 objectNormal = normalize(vec3(-_ddx, 0.0, 1.0));`
  - vertex `#include <begin_vertex>` → `vCardXY = position.xy;\nvec3 transformed = vec3(position);\ntransformed.z += uHalfW * (uCurve * (_nx * _nx - 0.3333) + uSlant * _nx);`
  - fragment `#include <common>` → `#include <common>\nuniform float uHalfW; uniform float uHalfH; uniform float uRadius;\nvarying vec2 vCardXY;`
  - fragment `#include <map_fragment>` → `#include <map_fragment>\nvec2 _q = abs(vCardXY) - (vec2(uHalfW, uHalfH) - uRadius);\nfloat _d = length(max(_q, 0.0)) + min(max(_q.x, _q.y), 0.0) - uRadius;\nfloat _aa = fwidth(_d);\nfloat _mask = 1.0 - smoothstep(-_aa, _aa, _d);\nif (_mask < 0.01) discard;\ndiffuseColor.a *= _mask;`
- `createCardDepthMaterial(uniforms)`: `new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide })`, onBeforeCompile: assign uniforms;
  - vertex `#include <common>` → same header as above (uCurve, uSlant, uHalfW, vCardXY)
  - vertex `#include <begin_vertex>` → `vCardXY = position.xy;\nfloat _nx = position.x / uHalfW;\nvec3 transformed = vec3(position);\ntransformed.z += uHalfW * (uCurve * (_nx * _nx - 0.3333) + uSlant * _nx);`
  - fragment `#include <common>` → same fragment header (uHalfW, uHalfH, uRadius, vCardXY)
  - fragment `#include <clipping_planes_fragment>` → `#include <clipping_planes_fragment>\nvec2 _q = abs(vCardXY) - (vec2(uHalfW, uHalfH) - uRadius);\nfloat _d = length(max(_q, 0.0)) + min(max(_q.x, _q.y), 0.0) - uRadius;\nif (_d > 0.0) discard;`
- Verify these `#include` chunk names exist in `node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js` and `depth.glsl.js` (three 0.186); if a chunk was renamed, use the equivalent and report it.
