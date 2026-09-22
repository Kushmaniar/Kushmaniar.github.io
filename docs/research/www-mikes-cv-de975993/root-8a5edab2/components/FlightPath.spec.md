# FlightPath Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/FlightPath.tsx` (stub: `export function FlightPath({ trackRef, tailRef }: FlightPathProps)` — keep the props interface)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/folio-desktop-1440-viewport.png` (unlit dotted curve from the plane icon down to the rail), `scroll-500-path-lit.png` (blue lit rail + lit dots), `scroll-bottom.png` (fully lit), `folio-mobile-390-full.png` (mobile curve swinging left)
- **Interaction model:** scroll-driven (window scroll listener + rAF easing), plus resize/ResizeObserver re-measure

## DOM Structure (keep these class names — `.pc-dots .pc-lit .path-rail .path-lit .path-tip` are styled by the global stylesheet)
```
div (root) ref=pathRef aria-hidden
  svg.path-curve ref=svgRef viewBox="0 0 44 110" fill="none"
    path.pc-dots ref=dotsRef d={DESKTOP_D}
    path.pc-lit  ref=litRef  d={DESKTOP_D} pathLength="1"
  div.path-rail ref=railRef
    div.path-lit
  svg.path-tip viewBox="0 0 7 3" fill="none"
    path d="M0.5 0.5 3.5 2.5 6.5 0.5"
```
## Styles for the parts NOT in the global stylesheet (Tailwind)
- root: position absolute; left calc(var(--rail-x) - 0.5px); top -65px (≤760px: -74px → mobile-first `top-[-74px] min-[761px]:top-[-65px]`); bottom var(--rail-tail, 24px); width 1px
- svg.path-curve: position absolute; left 0; top 0; width 44px; height 110px; overflow visible
- svg.path-tip: position absolute; left 50%; bottom -1px; width 7px; height 3px; transform translate(-50%); overflow visible
- (global CSS already gives: pc-dots dashed rule stroke; pc-lit blue stroke w/ dashoffset calc(1 - var(--curve-p)); path-rail dotted rail top 110px (75px ≤760); path-lit fill height var(--rail-p) with glow + tip dot; path-tip chevron stroke)

## Constants
```
DESKTOP_D = "M43 0V7.3A39 39 0 0 1 21.71 42.05A39 39 0 0 0 0.5 76.75V110"; DESKTOP_H = 110
R = 30; LEAD = 15; MOBILE_H = LEAD + R * 2 (75)
mobileD(w) = t = w + .5 → `M${t} 0V${LEAD}A${R} ${R} 0 0 1 ${t - R} ${LEAD + R}H${.5 + R}A${R} ${R} 0 0 0 0.5 ${MOBILE_H}`
EASE = 0.12
```

## Behavior (port exactly; two effects, deps [] / [trackRef, tailRef])
### Effect 1 — rail tail
- measure: `k = track.getBoundingClientRect().bottom - (tail.top + tail.height / 2)`; `track.style.setProperty("--rail-tail", `${k.toFixed(1)}px`)`. Run now + ResizeObserver on tail and track.
### Effect 2 — lighting
- State (locals in the effect): curveLen = 118, curveH = DESKTOP_H, railH = 0, pathTop = 0, dots: {el, y, lit}[], current = 0, target = 0, raf = 0.
- `layoutCurve(track)`: if `getComputedStyle(track).getPropertyValue("--plan-centre").trim() !== "1"` → curveH = 110; svg.removeAttribute("style"); svg viewBox "0 0 44 110"; both paths d = DESKTOP_D. Else (mobile): plane = track.querySelector(".plan-plane"); `w = Math.max(R * 2, planeRect.left + planeRect.width / 2 - (railRect.left + railRect.width / 2))`; curveH = MOBILE_H; svg viewBox `0 0 ${w + 1} ${MOBILE_H}`; svg.style.width = `${w + 1}px`; svg.style.height = `${MOBILE_H}px`; both d = mobileD(w).
- `measure()`: layoutCurve(track); curveLen = lit.getTotalLength() || 118; railH = rail.offsetHeight; pathTop = root.getBoundingClientRect().top + scrollY; dots = [...track.querySelectorAll(".tl-dot")] → { el, y: rect.top + rect.height / 2 + scrollY, lit: el.classList.contains("is-lit") }.
- `progress(y)`: max = max(0, documentElement.scrollHeight - innerHeight); max ≤ 0 → 1; else clamp01(y / max).
- `tick()`: raf = 0; `d = target - current`; `current = |d| < 2e-4 ? target : current + d * EASE`; `g = current * (curveLen + railH)`; `curveP = clamp01(g / curveLen)`; `railP = railH ? clamp01((g - curveLen) / railH) : 0`; set `--curve-p` and `--rail-p` (`toFixed(4)`) on root; `tipY = pathTop + curveH * curveP + railH * railP`; for each dot: `lit = dot.y <= tipY`; if changed → toggle class "is-lit". If current !== target → raf = rAF(tick).
- `onScroll()`: target = progress(scrollY); if !raf → raf = rAF(tick).
- `onResize()`: measure(); onScroll().
- Init: measure(); current = progress(scrollY); onScroll(). Listeners: window scroll (passive), window resize; track `animationend` where animationName is "itemReveal" or "itemRevealReduced" → onResize; ResizeObserver(onResize) on document.body. Clean all up (+ cancel raf).
- These DOM writes happen in effects/callbacks via refs (lint-safe).

## Verified live (1440×900)
- scrollY 0: --curve-p 0, nothing lit. scrollY 500: --curve-p 1.0000, --rail-p 0.4174, 4 of 10 dots lit, --rail-tail 31.0px. Bottom: all 10 lit, --rail-p 1.

## Responsive
- ≥761px: fixed desktop curve (44×110) from plan head (left -3px) down to rail.
- ≤760px: plan head centred over the column; curve recomputed to swing from the plane to the left rail (see mobile screenshot).
