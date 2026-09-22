# TimelineLogos Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/TimelineLogos.tsx` (stub: `export function TimelineLogos({ logos, company }: { logos: TimelineLogo[]; company: string })`)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/hover-logos-fueled.png`, `folio-desktop-1440-full.png` (rows of overlapping round logos above each company)
- **Interaction model:** hover-driven (pointer enter/leave), CSS transitions

## DOM Structure
```
span (row)  onPointerLeave → hover = { idx: null, ease: "out" }
  for each logo i:
    span (avatar)  onPointerEnter → hover = { idx: i, ease: "in" }
      <a> if logo.url, else <span>   (the circular logo)
        img src={logo.src} alt=""
```

## Computed Styles
### row
- display flex; align-items center; margin-bottom 6px
### avatar span
- position relative; display block; flex-shrink 0; every avatar after the first: margin-left -6px
- transform-origin center; transform: translateY(var(--shift, 0px)) scale(var(--scale-active, 1))
- transition: transform var(--avatar-dur) (.32s) var(--avatar-ease-in); will-change transform
- reduced motion: transition none; transform none
- runtime `style`: `--shift`, `--scale-active`, `transitionTimingFunction: var(--avatar-ease-${ease})`, `zIndex`
### logo (a | span)
- width 28px; height 28px (var(--tl-logo-size)); box-sizing border-box; border 0.5px solid var(--keyline); border-radius 50%; overflow hidden; display flex; flex-shrink 0; box-shadow 0 0 0 1px var(--keyline)
- if `logo.bg` set: background logo.bg (runtime style)
- anchor attrs: href={logo.url} target="_blank" rel="noreferrer noopener" aria-label={`${logo.name || company} website (opens in a new tab)`}
### img
- width 100%; height 100%; object-fit cover; display block; transform scale(1.1)

## States & Behaviors
### Hover lift (port exactly)
- Constants: LIFT = -4 (px), SCALE = 1.05, FALLOFF = 0.45.
- For avatar i with hovered index h: `shift = h == null ? 0 : LIFT * FALLOFF ** Math.abs(i - h)`; `--shift: ${shift.toFixed(3)}px`; `--scale-active: i === h ? 1.05 : 1`; `zIndex: i === h ? 2 : 1`.
- Easing switches: entering uses `var(--avatar-ease-in)` = cubic-bezier(.22,1,.36,1); leaving the row uses `var(--avatar-ease-out)` = cubic-bezier(.34,3.85,.64,1) (springy overshoot back to rest).
- Verified live (Fueled row, 4 logos, hovering index 2): shifts [-0.810, -1.800, -4.000, -1.800] px.

## Assets
- Logos come from props (already `asset()`-resolved in config): logo-studio/fahlo/matter-dark/matter-blue/contact/fueled/immi/sakara/webex.png (56×56 or 60×60).

## Responsive Behavior
- Identical at all widths.
