# mikes.cv — Visual QA

Clone served from `npm run build && npm run start`, compared against the live site in the same
Playwright/Chromium session at the same viewport.

## Layout parity (DOM measurements, identical unless noted)
Measured: document height, `.folio-window` box, sticky name block, tagline, every timeline entry,
company links, case cards, outro, memories fan, typography (size/weight/line-height/tracking/colour/family).

| Viewport | Result |
|---|---|
| 1440×900 | **All measured values identical.** docHeight 1956; window [613, 80, 200, 300]; entries [433,528,560,219] / [433,783,560,244] / [433,1063,560,219] / [433,1317,560,373]; memories [803,1726,161,62]; 10 timeline dots |
| 768×900 | **Identical.** docHeight 2024; window [277,154,200,300]; entries at x=97; plan head [110,506,16,15] |
| 390×900 | **Identical.** docHeight 2552; entries at x=24, width 327; mobile path curve re-computed to the same `viewBox "0 0 161 75"` |

## Pixel diff (same session, 1440×900, light, scroll 0)
- **0.04% of sampled pixels differ by >12/255; 0% differ by >60.**
- Every differing pixel falls in the airplane-window band (y≈200–300): the live 3D sky, whose cloud
  positions depend on elapsed time. Nothing else differs.
- Full-page captures also matched (desktop 0.06% >12, 0% >60; mobile 0.40% >12, 0% >60). The width
  delta in those files (1425 vs 1440) is a capture artifact: both pages reserve the same 15px
  scrollbar gutter (`clientWidth` 1425 for clone and original alike).

## Behaviour parity
| Behaviour | Original | Clone |
|---|---|---|
| Scroll-lit path @ scrollY 500 | `--curve-p` 1.0000, `--rail-p` 0.4174, 4/10 dots lit | 1.0000, 0.4168, 4/10 lit |
| Rail tail / rail height | `--rail-tail` 43.0px, rail 1172px | identical |
| Bottom of page | all 10 dots lit, `--rail-p` 1 | identical |
| Memories hover (index 2) | `--x` [-60.30, -35.10, 0.00, 35.20, 60.40], active `--y` -13.10px, z [5,4,10,2,1] | identical |
| Logo hover (4-logo row, index 2) | shifts [-0.810, -1.800, -4.000, -1.800] | identical |
| Footer link hover | colour → `--ink-link-hover`, bg → `--surface-chip`, label scale 1.05 | identical |
| Shade drag → cabin dark | `data-theme="dark"`, `mikescv-cabin-dark=1`, body #191817, title flips | identical |
| Click without drag | no theme change (click within 500ms of pointerup is dropped) | identical |
| Gate camera fit | `--reader-bottom-px: 644.12px` | **644.12px** |
| Gate swipe | slot → READING → traverse → SUCCESS, "Access granted", unlock key set | identical |
| Splash | z-index 100 monogram, `html.is-covered` | identical |
| Skip / Return to Gate | unlock key set / both keys cleared + reload | identical |

## Known differences
1. **3D animation phase.** Clouds, the water shader and the card's idle bob are time-driven, so a
   screenshot never matches frame-for-frame. Geometry, materials, lighting and camera match.
2. **Case-study routes are out of scope.** Cards link to `/fahlo`, `/matter`, `/contact`, `/webex`,
   `/sakara`, `/immi` as on the original, but only `/` was cloned, so those 404 instead of opening a
   case-study page. The original also has bespoke case-study components for them.
3. **Dev mode only:** with React StrictMode + HMR the three WebGL canvases can exhaust Chromium's
   per-page context budget and log "Context Lost". Production (`npm run build && start`) is clean;
   this did not reproduce on the live site because it ships a production bundle.
