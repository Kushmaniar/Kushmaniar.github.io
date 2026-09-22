# CaseCard Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/CaseCard.tsx` (stub: `export function CaseCard({ study }: { study: CaseStudyLink })`, server-compatible — no hooks needed; keep it without "use client")
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/hover-case-immi.png` (hover), `folio-desktop-1440-full.png` (rest)
- **Interaction model:** hover-driven (CSS only)

## DOM Structure
```
li
  a (card, named group: `group/case`)  href={study.to}
    span.tl-dot.tl-dot-case aria-hidden      ← keep these exact class names (global CSS positions/colours it; FlightPath toggles .is-lit)
    span (shots) aria-hidden
      span (shot 1) > img src={study.shots[0]} alt="" draggable={false}
      span (shot 2) > img src={study.shots[1]} …
      span (shot 3) > img src={study.shots[2]} …
    span (text)
      span (title) {study.title}
      span (desc)  {study.desc}
```
The card is a plain `<a href>` (the original routes to case-study pages client-side; those pages are out of scope).

## Computed Styles
### a (card)
- position relative (REQUIRED: the .tl-dot is absolutely positioned against it); display flex; align-items center; gap 7px; padding 2px 15px; border-radius 16px; text-decoration none; background transparent
- transition: background-color .26s var(--ease-out); hover: background var(--surface-hover)
- ≤620px: padding-left 8px; padding-right 8px
### shots span
- position relative; width 66px; height 63px; flex-shrink 0
### each shot span
- position absolute; left 50%; top 50%; border 1.5px solid var(--keyline); border-radius 2.5px; overflow hidden
- box-shadow: 0 0.85px 5px rgba(var(--shadow-rgb), .1), 0 0.43px 1.3px rgba(var(--shadow-rgb), .06)
- transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(var(--r)) scale(var(--s, 1))
- transition: transform .38s var(--avatar-ease-in)
- shot 1: width 25.7px; height 34.1px; z-index 1; --x -13.7px; --y -0.8px; --r -9.94deg
- shot 2: width 35px; height 46.3px; z-index 3; --x -1.6px; --y -0.7px; --r 0deg
- shot 3: width 30px; height 39.7px; z-index 2; --x 11.3px; --y 0.5px; --r 7.21deg
- reduced motion: transition none
### img inside shot
- display block; width 100%; height 100%; object-fit cover (override preflight height:auto)
### text span
- display flex; flex-direction column; justify-content center; flex: 1 0 0; min-width 0
### title
- font-weight 500; font-size 14px; line-height 17.5px; color var(--ink-title)
### desc
- font-weight 500; font-size 13px; line-height 21.13px; color var(--ink-desc)

## States & Behaviors
### Hover fan (card hover → shot vars; use `group-hover/case:[--x:…]` utilities)
- shot 1: --x -18px; --y -3px; --r -15deg
- shot 2: --y -3px; --s 1.03 (x, r unchanged)
- shot 3: --x 15.5px; --y -2px; --r 12deg
- card background → var(--surface-hover) (light: rgba(23,22,15,.035); dark: rgba(255,255,255,.045)), .26s

## Text Content
From props (e.g. "Immi" / "A world class, family friendly AR animation studio in your pocket").

## Responsive Behavior
- ≥621px: padding 2px 15px. ≤620px: padding 2px 8px. Text wraps (desc may take 2 lines at 390px).
