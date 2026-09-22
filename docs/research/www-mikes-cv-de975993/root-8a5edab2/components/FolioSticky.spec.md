# FolioSticky Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/FolioSticky.tsx` (stub: `export function FolioSticky({ booting }: { booting: boolean })`)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/folio-desktop-1440-viewport.png` (top-left block), `folio-mobile-390-viewport.png` (centred at top)
- **Interaction model:** static + time-driven count-up

## DOM Structure
```
aside
  span (rail) aria-hidden
  div (lines)
    p (name)  "Mike Barton"
    p         "Manchester, UK"
    p aria-hidden  "{lat}° N, {lon}° W"
    p.sr-only      "53.4888° north, 2.2424° west"
    p         {gmtOffset}   e.g. "GMT+1"
```

## Computed Styles (desktop ≥1220px)
### aside
- position fixed; top 72px; left clamp(24px, calc((100vw - var(--folio-col-w)) / 2 - 306px), 72px) (= 72px at 1440); z-index 3
- display flex; align-items center; gap 22px; pointer-events none
### rail span
- align-self stretch; width 8px; flex-shrink 0
- background-image radial-gradient(circle at 0.8px 0.8px, var(--folio-rule) 0.8px, transparent 0.9px); background-size 3.2px 3.6px
### lines div
- padding 12px 0; font-family var(--folio-mono); font-weight 500; font-size 12px; line-height 1.8; letter-spacing 1.84px; text-transform uppercase; color var(--folio-mute) (`text-folio-mute`); white-space nowrap
### name p
- color var(--folio-ink)
### measured at 1440: aside box x=72 y=72; name baseline row y≈94, 4 visible lines, line box 21.6px

## Responsive (≤1219px — write mobile-first: these are the BASE styles, desktop ones behind `min-[1220px]:`)
- aside: position static; align-self center; padding 40px 0 0; gap 0; pointer-events auto
- rail: display none
- lines: padding 0; text-align center

## States & Behaviors
### Coordinate count-up (port exactly)
- Two instances: lat 53.4888, lon 2.2424; `active = !booting`.
- `digits = String(Math.floor(Math.abs(target))).length`; format(v): `[int, frac] = v.toFixed(4).split(".")` → `` `${int.padStart(digits, "0")}.${frac}` `` (so the count shows "00.0000"… "53.4888").
- Initial value: `active ? 0 : target` (under the splash it shows the final value).
- When `active` first becomes true (run once — guard with a ref): if `prefersReducedMotion()` → value = target; else animate over 900 ms with rAF: `value = target * easeOutExpo(p)`, `easeOutExpo(p) = p === 1 ? 1 : 1 - 2 ** (-10 * p)`, final frame sets exactly `target`. Cancel rAF on cleanup. (Avoid synchronous setState in the effect body — start the rAF and set state from its callback.)
### GMT offset
- Default "GMT+1". Compute on mount and every 30 min: `new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "longOffset" }).formatToParts(new Date()).find(p => p.type === "timeZoneName")?.value ?? "GMT"` → e.g. "GMT+01:00"; `h = parseInt(s.slice(3), 10) || 0`; text = `GMT${h < 0 ? "-" : "+"}${Math.abs(h)}`.
- This component only renders on the client, so a lazy `useState` initialiser may compute it directly; the interval callback updates it.

## Text Content (verbatim)
Mike Barton / Manchester, UK / 53.4888° N, 2.2424° W / 53.4888° north, 2.2424° west / GMT+1

## Hover states
- N/A (no interactive children).
