# Memories Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/Memories.tsx` (stub: `export function Memories({ items }: { items: Memory[] })`)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/hover-memory-3.png` (hover, tooltip "I MISS JAPAN"), `folio-desktop-1440-full.png` (rest, right of the outro text)
- **Interaction model:** hover-driven (pointer enter/leave), CSS transitions

## DOM Structure
```
div (fan)  onPointerLeave → active = null
  for each item i:
    span (card, + "is-active" styling when active)  onPointerEnter → active = i
      img className={item.turned ? turned : undefined} src alt={item.caption || ""} draggable={false}
      {active === i && item.caption && <span (tip) aria-hidden>{item.caption}</span>}
```

## Computed Styles
### fan div
- position relative; width 161px; height 62px; flex-shrink 0; margin-right 29px (≤760px: margin-right 0)
- custom props: --mem-w 42.4px; --mem-h 56.5px; --mem-b 1.234px
### card span
- position absolute; left 50%; top 50%; width var(--mem-w); height var(--mem-h)
- border: var(--mem-b) solid var(--keyline); border-radius 5.65px; overflow visible
- transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(var(--r)) scale(var(--s, 1))
- box-shadow: 0 0.6px 3.6px rgba(var(--shadow-rgb), .1), 0 0.3px 0.9px rgba(var(--shadow-rgb), .06)
- transition: transform .42s var(--avatar-ease-in), box-shadow .42s var(--avatar-ease-in)
- active: box-shadow 0 6px 18px rgba(var(--shadow-rgb), .16), 0 1px 3px rgba(var(--shadow-rgb), .08)
- reduced motion: transition none
### img
- display block; width 100%; height 100%; object-fit cover; border-radius 4.4px
- turned variant: position absolute; left 50%; top 50%; width calc(var(--mem-h) - var(--mem-b) * 2); height calc(var(--mem-w) - var(--mem-b) * 2); transform translate(-50%, -50%) rotate(-90deg)
### tip span
- position absolute; left 50%; bottom calc(100% + 9px); transform translate(-50%) rotate(calc(var(--r) * -1))
- padding 3px 8px; border-radius 6px; background #141313eb; color #fff
- font-family var(--folio-mono); font-weight 500; font-size 9px; line-height 1.5; letter-spacing .6px; text-transform uppercase; white-space nowrap; pointer-events none
- animation: memTipIn .18s var(--ease-out) both (global keyframe); reduced motion: none

## States & Behaviors
### Hover fan (port exactly)
- LAYOUT = [{x:-55.8,y:0.2,r:-7.65},{x:-26.1,y:-1.7,r:-3},{x:0,y:-2.1,r:0},{x:26.2,y:-1.4,r:3},{x:55.9,y:0.2,r:7.54}]; items beyond 5 reuse the last entry.
- For card i with active index a: `pos = LAYOUT[i] ?? LAYOUT.at(-1)`; `isActive = a === i`; `d = a == null ? 0 : i - a`; `push = d === 0 ? 0 : Math.sign(d) * 9 * 0.5 ** (Math.abs(d) - 1)`.
- runtime style: `--x: ${(pos.x + push).toFixed(2)}px`; `--y: ${(isActive ? pos.y - 11 : pos.y).toFixed(2)}px`; `--r: ${(isActive ? pos.r * 0.3 : pos.r).toFixed(2)}deg`; `--s: isActive ? 1.12 : 1`; `zIndex: isActive ? 10 : LAYOUT.length - i`.
- Verified live, hovering index 2: --x [-60.30, -35.10, 0.00, 35.20, 60.40]; --y of active -13.10px; z-index [5,4,10,2,1].

## Assets
- From props: m1.jpg (320×480) "Home sweet home", m2.jpg (374×480) "Happy place", m3.jpg (480×320) "I Miss Japan", m4.jpg (360×480) "NYC, ILY", m5.jpg (480×320) "Wannabe Rockstar". None are `turned` in the data, but support the flag.

## Responsive Behavior
- ≥761px: margin-right 29px (sits right of the outro text). ≤760px: margin-right 0; the outro wraps so the fan drops below the text (see folio-mobile-390-full.png).
