# PlaneWindow Specification

## Overview
- **Target files:** `PlaneWindow.tsx` (stub: `export function PlaneWindow({ paused }: { paused: boolean })`) + new `cabinTheme.ts` + new `useShadeSpring.ts`, all in `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/`
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/folio-desktop-1440-viewport.png` (open), `shade-drag-partial.png` (mid-drag), `folio-desktop-1440-dark.png` (closed/dark)
- **Interaction model:** drag-driven (pointer capture, spring physics) → theme switch. Plain click does nothing; keyboard activation toggles.
- Renders client-only (parent mounts it after hydration), so reading `document` in lazy initialisers is safe; module scope must still guard `typeof document`.

## Geometry constants (source art is 600×900, drawn at 1/3 → 200×300)
```
OPEN = {top:132,bottom:716,left:79,right:520}, OPEN_R = 170      // shutter opening
SKY  = {top:179,bottom:653,left:118,right:481}, SKY_R = 150
SHADE_FRAC = (723 - 210) / 900          // 0.57
TRAVEL = 300 * SHADE_FRAC               // 171px of drag = full shade
insetClip(r, radius, g) = `inset(${(r.top-g)/900*100}% ${(600-r.right-g)/600*100}% ${(900-r.bottom-g)/900*100}% ${(r.left-g)/600*100}% round ${(radius+g)/3}px)`
SKY_CLIP = insetClip(SKY,150,2); SHUTTER_CLIP = insetClip(OPEN,170,6); HIT_CLIP = insetClip(OPEN,170,0)
SHUTTER_BOX = { left: 79/3 px, top: 132/3 px, width: (520-79)/3 px, height: (716-132)/3 px, borderRadius: 170/3 px }
SKY_GRADIENT = "linear-gradient(to bottom, #5CADF4 0%, #94CCFB 33%, #C8E6FB 45%, #FFFFFF 50%)"
```

## DOM Structure & styles (static → Tailwind; computed → `style`)
```
div root: relative w-[200px] h-[300px] mx-auto isolate select-none [-webkit-touch-callout:none]; onContextMenu/onDragStart preventDefault
  div sky: absolute inset-0; clipPath SKY_CLIP (+WebkitClipPath); background SKY_GRADIENT
    canRenderWebGL() (lazy useState) ? <Suspense fallback={<StaticClouds/>}><PlaneWindowScene paused={paused || shade > 0.92}/></Suspense> : <StaticClouds/>
    (PlaneWindowScene = React.lazy(() => import("./PlaneWindowScene")))
  Layer src=asset("/window-back.webp") dim=0.86
  div: absolute inset-0 pointer-events-none; clipPath SHUTTER_CLIP
    Layer src=asset("/window-shutter.webp") dim=0.82 + transform translate3d(0, ${-(1 - shade) * SHADE_FRAC * 100}%, 0)
    div aria-hidden: absolute; SHUTTER_BOX; pointer-events-none;
        boxShadow "inset 0 0 11px rgba(28, 25, 22, 0.42), inset 0 0 3px rgba(28, 25, 22, 0.30)";
        mask-image url(shutter) (+webkit); mask-size 200px 300px; mask-repeat no-repeat;
        mask-position `${-79/3}px ${-132/3 - (1 - shade) * TRAVEL}px`
  Layer src=asset("/window-front.webp") dim=0.8
  div aria-hidden: absolute inset-0 pointer-events-none; mask-image url(front) mask-size cover no-repeat; mix-blend-multiply;
      opacity shade * 0.55; background linear-gradient(to bottom, #6a6e78 0%, #878b95 38%, #a2a7ae 100%)
  button type="button" {...handlers} aria-pressed={shade > .5} title={label}: absolute inset-0 bg-none border-0 p-0 touch-none
      [-webkit-tap-highlight-color:transparent]; clipPath HIT_CLIP; cursor dragging ? "grabbing" : "grab"
    span visually hidden (sr-only) {label}      label = shade > .5 ? "Open the window shade" : "Close the window shade"

Layer = img aria-hidden alt="" draggable=false: absolute inset-0 w-full h-full max-w-none object-cover pointer-events-none; filter brightness(${1 - shade * dim})
StaticClouds = 3 × img asset("/cloud.png") aria-hidden alt="" absolute pointer-events-none max-w-none h-auto with
  {left:"-30%",top:"34%",width:"105%",opacity:.7}, {left:"30%",top:"30%",width:"100%",opacity:.6}, {left:"-15%",top:"46%",width:"135%",opacity:.95}
  + div absolute inset-[64%_0_0_0] bg linear-gradient(to bottom, rgba(255,255,255,0) 0%, #FFFFFF 70%)
```

## useShadeSpring({ travel, initial, onChange }) → { shade, dragging, handlers } (port exactly)
- Initial shade: `document.documentElement.dataset.theme === "dark" ? 1 : 0`.
- State: shade, settled (init true), dragging. Refs: pos, anim {v, target|null, raf, dragging}, drag {y, from, t, armed}|null, lastUp.
- `useEffect(() => onChange?.(shade, settled), [shade, settled, onChange])`.
- springTo(target): anim.target = target; if raf running return. Reduced motion → jump (pos=target, settled, v=0). Else rAF loop: `dt = min((ts-last)/1000, 1/30)`; `a = 190*(target - x) - 26*v`; `v += a*dt`; `nx = x + v*dt`; if `|v| < .002 && |target-nx| < .001` → snap to target, settled=true, v=0, stop; else pos = clamp01(nx), setShade.
- tweenTo(target, ms = 900): cancel raf; reduced → jump; else ease `t<.5 ? 4t³ : 1 - (-2t+2)³/2` from pos; on end snap, settled=true, v=0.
- onPointerDown(e): ignore non-primary buttons; stop raf; setPointerCapture; dragging on; settled=false; v=0; drag = {y: clientY, from: pos, t: now, armed: false}.
- onPointerMove(e): if !drag return. `x = clamp01(from + (clientY - drag.y)/travel)`. finish(goal) = end drag (dragging off, drag=null, pos=x, setShade(x)) then `tweenTo(goal, max(260, 900*|goal - x|))`.
  - if !armed && |x - from| > .1 → armed. If armed: x ≤ .1 → finish(0); x ≥ .9 → finish(1).
  - goal = from < .5 ? 1 : 0; if (goal===1 ? x ≥ .5 : x ≤ .5) → finish(goal).
  - else: velocity v = (x - pos)/dt (dt s since drag.t; skip if 0); if x is 0 or 1, v = 0; drag.t = now; pos = x; setShade(x).
- onPointerUp / onPointerCancel(e): lastUp = now; if !drag return; end drag; release capture; `v > 1.6 → springTo(1)`; `v < -1.6 → springTo(0)`; else `springTo(pos > .5 ? 1 : 0)`.
- onClick: if `now - lastUp < 500` return (drops the click that follows a pointer gesture); else toggle = stop raf, settled=false, `tweenTo(pos > .5 ? 0 : 1)`.

## cabinTheme.ts — `export function onShadeChange(shade: number, settled: boolean)` (pass to useShadeSpring as onChange)
- Module state: `isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"`; lazily-created veil div appended to body: `aria-hidden="true"`, cssText `position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0`; recolour timer; lazily-created `Audio(asset("/shade-on.m4a"))` preload auto, volume 0.2 (on 'error' disable sound).
- onShadeChange: if settled: `shade >= .999 → commit(true); return`, `shade <= .001 → commit(false); return`. Otherwise: veil.style.transition = ""; veil.style.backgroundColor = veilColour(!isDark); veil.style.opacity = String(isDark ? 1 - shade : shade).
- commit(dark): if dark === isDark return; isDark = dark; play sound (currentTime=0, play().catch); after 60ms, if still isDark === dark → apply(dark).
- apply(dark): recolour pulse (remove `is-recolouring` from <html>, force reflow `void html.offsetWidth`, add it, remove after 580ms); set/delete `html.dataset.theme = "dark"`; localStorage set `CABIN_DARK_KEY` "1" / remove (try/catch); veil transition `opacity 300ms var(--ease-out, ease-out)`, opacity "0", clear the transition after 340ms.
- veilColour(dark) = getComputedStyle(html).getPropertyValue(dark ? "--veil-dark" : "--veil-light").trim() || (dark ? "#191817" : "#faf5f5").
- Import `CABIN_DARK_KEY`, `asset` from `./config`.

## Verified live
- Box 200×300 at x=620,y=80 (1440). Dragging 48px down → veil opacity 0.2807 in rgb(25,24,23). Releasing past halfway → `data-theme="dark"`, key `mikescv-cabin-dark=1`, body bg rgb(25,24,23), title "Open the window shade".

## Responsive
- Fixed 200×300 at every width, centred.
