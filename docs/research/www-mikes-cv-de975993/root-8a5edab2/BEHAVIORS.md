# mikes.cv — Behaviors

Source: https://www.mikes.cv/ (Vite + React 18 SPA, three r167, @react-three/fiber + drei + rapier + postprocessing).
All values below were read from the shipped CSS/JS bundles and confirmed live with Playwright at 1440/768/390.

## App state machine (root)
- States: `splash` → (`pass` | `site`). `pass` only when WebGL is usable (`canRenderWebGL()`) AND `localStorage["mikescv-pass-unlocked"] !== "1"`.
- While not `site`: `<html>` gets class `is-covered` (overflow hidden on html+body); folio `<main>` gets class `booting`, `aria-hidden`, `inert` (reveal animations paused).
- Splash: min 620ms on screen, waits for fonts + images + 3D textures + AccessPass chunk (12s cap) + 6 rAFs, then calls `onDone` → state = pass|site; 280ms later splash is unmounted. Splash leave: `opacity 0, blur(6px)` over 0.28s ease.
- Pass granted or Skip → `localStorage["mikescv-pass-unlocked"]="1"`, state = site.
- "Return to Gate" (footer, only when WebGL usable) → removes both storage keys, `location.reload()`.
- Context menu + dragstart are prevented on `img, video, canvas, picture, svg`.

## Theme (cabin light)
- `data-theme="dark"` on `<html>` when `localStorage["mikescv-cabin-dark"]==="1"`, applied by a blocking head script before paint.
- Toggled ONLY by dragging the window shade (see PlaneWindow). A plain click is ignored (click within 500ms of pointerup is dropped); keyboard Enter/Space toggles with a 900ms cubic ease.
- While dragging, a fixed full-screen veil div (z-index 4, pointer-events none) is painted the *opposite* veil colour with opacity = shade (or 1-shade when already dark).
- On commit (shade ≥0.999 or ≤0.001 when settled): plays `/shade-on.m4a` (volume 0.2); 60ms later: adds `html.is-recolouring` (color/fill/stroke transitions 0.52s ease-out on `.folio *`, removed after 580ms), flips `data-theme`, persists the key, fades veil to 0 over 300ms.

## Scroll
- Native scroll, no smooth-scroll library, no scroll-snap.
- Flight path: progress = scrollY / (scrollHeight - innerHeight). Eased toward target with factor 0.12 per rAF. Curve lights first (`--curve-p`), then the rail (`--rail-p`). Each `.tl-dot` gets `.is-lit` once the lit tip passes its centre (dot border+fill go blue, one-shot pulse ring 0.72s).
- Observed: scrollY=500 at 1440 → `--curve-p:1`, `--rail-p:0.4174`, 4/10 dots lit; bottom → all 10 lit.

## Load reveal (time-driven)
- `itemReveal` 0.4s ease-out both: from `opacity 0; blur(8px); translateY(-12px) scale(.985)` to `opacity var(--reveal-opacity,1)`. Delays: window 0ms, intro 60ms (opacity .8), plan-head/outro 0ms, timeline entries 120/180/240/300ms.
- Sticky coordinates count up from 0 over 900ms (easeOutExpo) once booting ends.

## Hover
- Timeline logos: hovered avatar lifts -4px & scales 1.05; neighbours lift -4·0.45^|Δ|. Enter easing `cubic-bezier(.22,1,.36,1)`, leave easing `cubic-bezier(.34,3.85,.64,1)` (springy), 0.32s. Live: Fueled row hovering idx 2 → shifts [-0.81,-1.8,-4,-1.8].
- Case card: background → `--surface-hover` (0.26s); three shots fan out (0.38s).
- Memories: hovered card lifts -11px, scale 1.12, rotation ×0.3, neighbours pushed ±9·0.5^(|Δ|-1) px, tooltip caption fades in (0.18s). Live: hover #3 → x [-60.3,-35.1,0,35.2,60.4].
- Footer links: colour → `--ink-link-hover`, bg → `--surface-chip`, label scale 1.05 (0.16s).
- Company name: underline on hover.

## Gate (AccessPass, WebGL)
- Card hovers/bobs (kinematic). Drag it (pointer capture); dropping outside reader → dynamic fall with physics, respawn when off-screen or resting >1.2s.
- Dragging into the slot row (|y - slot| < 0.15) → status `near` ("READING", amber). Traversing > 2.6 units horizontally inside the slot → `granted` ("SUCCESS", green, sparkle sound), hint becomes "Access granted", white fade overlay 0.7s, `onGranted` after 1000ms.
- Leaving slot mid-swipe → `error` ("ERROR", red, error sound) for 1800ms.
- Synth sounds via WebAudio (press/error/sparkle), only after user activation.
- Hint: "Swipe boarding pass to enter", shimmer gradient 2.2s linear infinite, positioned 40px under the reader (`--reader-bottom-px`).

## Responsive
- ≥1220px: sticky name block fixed at top-left, rail dots visible.
- ≤1219px: sticky block becomes static, centred above the window.
- ≤760px: timeline indented 32px, year labels hidden, plan head centred over column, path curve re-computed to swing from plane to left rail.
- ≤620px: tighter gaps, `.wide-only` br hidden, footer links 10px.
- Gate: hint/skip font sizes step down at 768/480; short screens (≤500px tall) tighten hint offset.
