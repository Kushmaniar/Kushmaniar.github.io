# mikes.cv — Page Topology

Output plan
- Target: https://www.mikes.cv/ → route `/` (`src/app/page.tsx`, replaces untouched template scaffold)
- site-key `www-mikes-cv-de975993` (sha256("https://www.mikes.cv")[:8]), page-key `root-8a5edab2` (sha256("/")[:8])
- Components: `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/`
- Assets: `public/sites/www-mikes-cv-de975993/root-8a5edab2/` (48 files, downloader `scripts/download-assets-www-mikes-cv-de975993-root-8a5edab2.mjs`)
- Screenshots: `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/`
- Shared foundation changes: `src/app/layout.tsx` (fonts preload, theme script, metadata), `src/app/globals.css` (tokens)

## Layers (z-index)
| z | Layer | Type |
|---|---|---|
| 100 | Splash (monogram) | fixed overlay, time-driven |
| 10 | Pass stage (gate) | fixed overlay, drag-driven 3D |
| 6 | `.folio-window` | flow, draggable shade |
| 5 | Footer links | fixed bottom |
| 4 | Footer progressive blur + tint; theme veil | fixed bottom / fixed full |
| 3 | Sticky name block | fixed (≥1220px) / static |

## Flow content (`main.folio`, column 560px centred, padding 80px 0 168px, gap 48px)
1. **FolioSticky** — aside, fixed top 72px left clamp(); mono uppercase lines. Static + count-up.
2. **PlaneWindow** — 200×300 layered window (WebGL sky/clouds behind), drag shade → theme. Drag-driven.
3. **Intro** — tagline + sub, centred, max 460px.
4. **FolioTrack** (relative, gap 36px)
   - Plan head ("FLIGHT PLAN" + plane icon), absolute above rail
   - **FlightPath** — dotted curve + rail with scroll-lit blue progress. Scroll-driven.
   - **Timeline** `<ol>` of 4 entries: logos row (hover), head (year/route, dot, company, badge), body (role, desc), case cards (hover fan).
   - **Outro** — text + **Memories** fan (hover).
5. **FolioFooter** — fixed progressive blur (5 backdrop layers + tint) + centred mono links.

## Gate overlay (AccessPass)
- Full-screen R3F canvas (bg #faf5f5), camera fov 25; Rapier physics (gravity -18); boarding pass card (kinematic/dynamic), card reader (fixed body, rounded boxes, LCD, LED), contact shadow shader, area light, env lightformers, bloom.
- DOM: shimmer hint, Skip button (bottom-right 40px), white fade overlay.
