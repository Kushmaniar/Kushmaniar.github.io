# Splash Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/Splash.tsx` (stub exists — keep `SplashProps` and `export function Splash`)
- **Screenshot:** none (on screen ~0.6s). Visual: a 60×60 blue monogram centred on the page background with a light sheen sweeping left→right.
- **Interaction model:** time-driven (preload gate + CSS/SMIL animation)

## DOM Structure
```
div.splash  role="status" aria-live="polite"
  div (monogram wrapper)
    span.sr-only "Loading"
    svg viewBox="0 0 100 100" aria-hidden
      defs
        linearGradient#splash-sheen gradientUnits="userSpaceOnUse" x1={-120} y1="0" x2="0" y2="0"
          stop offset 0%  stopColor "var(--folio-blue)"
          stop offset 28% stopColor "var(--folio-blue)"
          stop offset 50% stopColor "var(--path-blue)"
          stop offset 72% stopColor "var(--folio-blue)"
          stop offset 100% stopColor "var(--folio-blue)"
          animate attributeName="x1" values="-120;100" dur="2.4s" repeatCount="indefinite"
          animate attributeName="x2" values="0;220"   dur="2.4s" repeatCount="indefinite"
        mask#splash-mask → three <path fill="#fff"> with d:
          "M25.713 59.087C30.905 59.087 35.114 63.297 35.114 68.489 35.114 73.680 30.905 77.890 25.713 77.890 20.521 77.890 16.311 73.680 16.311 68.489 16.311 63.296 20.521 59.087 25.713 59.087Z"
          "M84 22.110V77.890H67.078V22.110H84Z"
          "M63.318 66.922L49.217 77.576 16 22.110H35.428L63.318 66.922Z"
      g (mark)  → rect width="100" height="100" fill="url(#splash-sheen)" mask="url(#splash-mask)"
```

## Computed Styles
### div.splash
- position fixed; inset 0; z-index 100; display grid; place-items center; padding 0 6vw; background var(--folio-bg)
- transition: opacity .28s ease, filter .28s ease
- leaving state: opacity 0; filter blur(6px); pointer-events none
### svg
- display block; width 60px; height 60px
### g (mark)
- transform-origin: 50px 50px; animation: splashMarkIn .62s var(--ease-out) both (keyframe is global: scale .72/opacity 0 → scale 1/opacity 1)
- reduced motion: animation splashMarkIn .2s ease both; and hide the `<animate>` elements (`motion-reduce:[&_animate]:hidden` on the wrapper)

## States & Behaviors
### Preload gate (port exactly)
- **Trigger:** first render where `ready === true` (effect with `[ready]` deps; guard so it only ever runs once).
- On start: `start = performance.now()`; run `preloadSite(targets.map(r => r.current))`; when it resolves, wait `max(0, 620 - elapsed)` ms, then set leaving state AND call `onDone()` (use a ref for the latest onDone). Clean up: cancelled flag + clearTimeout.
- `preloadSite(roots)` (put it in the same file, not exported) resolves when ALL of these settle, raced against a 12000 ms timeout:
  1. For each non-null root: every `img:not([data-lazy])` → `img.complete ? resolved : once('load'|'error')`; every `video:not([data-lazy])` → `readyState >= 2 ? resolved : once('loadeddata'|'error')`.
  2. Fonts: `document.fonts.load(f).catch(()=>{})` for `'400 16px "MB Sans"'`, `'500 16px "MB Sans"'` and, only if `canRenderWebGL()`, `'400 62px "MB LCD"'`; then `document.fonts.ready`; swallow errors; skip entirely if `document.fonts` is missing.
  3. If `canRenderWebGL()`: `import("./access-pass/AccessPass").catch(() => {})` (warms the gate chunk).
  4. Image warm-up via `new Image()` (resolve on load or error): always `asset("/cloud.png")`; if WebGL also `asset("/CirrusCloud.png")`, `asset("/waternormals.jpg")`, `asset("/folio/boarding-pass.png")`, `asset("/folio/boarding-pass-back.png")`.
  - After all settle, wait 6 animation frames (recursive rAF countdown), then resolve.
- Imports: `asset`, `canRenderWebGL` from `./config`.

## Assets
- none rendered; warms the URLs above.

## Text Content (verbatim)
- sr-only: "Loading"

## Responsive Behavior
- Same at all widths (grid-centred 60px mark, 6vw side padding).
