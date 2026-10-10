# Kush Maniar Portfolio

Next.js 16 static site deployed to GitHub Pages via `kushmaniar.me`.

## Stack
- Next.js 16 (App Router, React 19, TypeScript strict)
- Tailwind CSS v4, shadcn/ui
- Static export (`output: "export"`)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (outputs to `out/`)
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check

## Deployment
Push to `main` triggers GitHub Actions → builds static export → deploys to GitHub Pages.
Custom domain: `kushmaniar.me` (CNAME in `public/CNAME`).
