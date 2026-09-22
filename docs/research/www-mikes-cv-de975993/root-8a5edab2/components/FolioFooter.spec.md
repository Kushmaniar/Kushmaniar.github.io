# FolioFooter Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/FolioFooter.tsx` (stub: `export function FolioFooter({ onReset }: { onReset?: () => void })` — renders a Fragment with the blur layer and the footer; server-compatible, no hooks)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/folio-desktop-1440-viewport.png` (bottom strip), `hover-footer-linkedin.png` (hover chip)
- **Interaction model:** static, fixed to viewport bottom; hover transitions

## DOM Structure
```
div (fx) aria-hidden
  div (pb1) div (pb2) div (pb3) div (pb4) div (pb5)
  div (tint)
footer
  div (inner)
    nav (links)
      {onReset && <button type="button" onClick={onReset}><span label>Return to Gate</span></button>}
      <a href="https://x.com/mjbarton_" target="_blank" rel="noreferrer noopener"><span label>X</span></a>
      <a href="https://www.linkedin.com/in/mikejbarton/" …><span label>LinkedIn</span></a>
      <a href={EMAIL_HREF}><span label>Email</span></a>        (no target)
```
Use `SOCIAL_LINKS` and `EMAIL_HREF` from `./config`.

## Computed Styles
### fx div
- position fixed; left 0; right 0; bottom 0; height 160px; z-index 4; pointer-events none
### pb layers (each: position absolute; inset 0)
| layer | backdrop-filter (+ -webkit-) | mask-image (+ -webkit-) |
|---|---|---|
| pb1 | blur(0.6px) | linear-gradient(to top, #000 0%, #000 92%, transparent 100%) |
| pb2 | blur(1.5px) | linear-gradient(to top, #000 0%, #000 55%, transparent 80%) |
| pb3 | blur(3px) | linear-gradient(to top, #000 0%, #000 35%, transparent 60%) |
| pb4 | blur(6px) | linear-gradient(to top, #000 0%, #000 20%, transparent 42%) |
| pb5 | blur(12px) | linear-gradient(to top, #000 0%, #000 8%, transparent 25%) |
### tint
- position absolute; inset 0; background linear-gradient(to top, rgba(var(--footer-tint-rgb), .9), rgba(var(--footer-tint-rgb), .55) 45%, rgba(var(--footer-tint-rgb), 0))
### footer
- position fixed; left 0; right 0; bottom 0; z-index 5; padding 44px 0 32px
### inner
- width min(100% - 3rem, 560px); margin 0 auto; display flex; justify-content center
### nav
- display flex; align-items center; justify-content center; flex-wrap wrap; gap 17px (≤620px: 4px)
### link (button + a)
- display inline-flex; align-items center; background none; border none; padding 2px 10px; border-radius 999px; cursor pointer
- font-family var(--folio-mono); font-weight 500; font-size 12px; line-height 1.8; letter-spacing 2.16px; text-transform uppercase; color var(--folio-mute); text-decoration none
- transition: color .16s var(--ease-out), background-color .16s var(--ease-out)
- ≤620px: font-size 10px; letter-spacing 1.1px; padding 2px 6px
### label span
- display inline-block; transition transform .16s var(--ease-out)

## States & Behaviors
### Hover (link)
- color → var(--ink-link-hover) (#5c5b5b light / #d6d4d1 dark); background → var(--surface-chip) (#f2f0f0 / #2b2928); label scale(1.05)
- Measured at 1440: links centred, baseline y≈856; text "RETURN TO GATE  X  LINKEDIN  EMAIL".

## Text Content (verbatim)
Return to Gate / X / LinkedIn / Email (rendered uppercase via CSS)

## Responsive Behavior
- ≥621px as above; ≤620px smaller links + 4px gap (fits on one line at 390px: "RETURN TO GATE X LINKEDIN EMAIL").
