# KIN Website — Copilot Instructions

You are working on the KIN website MVP (Next.js 16, React 19, TypeScript).
Product source of truth: `docs/mvp-structure.md`. Visual source of truth: `docs/design-protocol.md`.
Build order: P0 first, then P1, then P2 (see `docs/mvp-structure.md` section 十).

## Folder tree (from docs/builders-protocol.md — OBEY ALWAYS)

```
src/app/          <- ROUTES: one folder per URL. Pages only, NO logic here.
src/components/   <- UI ONLY: dumb components, no data fetching, no localStorage
src/features/     <- DOMAIN LOGIC: pure functions + types, no UI
src/data/         <- seed/demo data (dies when a real backend arrives)
src/lib/storage/  <- THE SEAM: UI never touches localStorage directly.
                     StorageAdapter interface + local-adapter.ts implementation.
```

Mantra: **pages compose, features compute, components render, storage persists.**
New feature = new folder under `src/features/`. Old code stays untouched.

## Design (from docs/design-protocol.md — OBEY ALWAYS)

KIN uses an editorial magazine visual language ("KIN Editorial Magazine",
Revue Faire-inspired): dense typography, compact editorial grids, darkened
photographic backgrounds with white text, asymmetrical image/text compositions.
Serif display (Times New Roman/Georgia) + sans body (Arial/Helvetica).

NEVER produce: generic SaaS landing page, excessive whitespace, oversized
rounded cards everywhere, centered headline + three equal feature cards,
repetitive card grids, decorative gradients.

## Rules

- Read `docs/mvp-structure.md` before building any page — it defines the sitemap,
  the package template (Hero Gift + Fillings + Personal Message + README Guide +
  Artist's Process Note), and what is P0 vs P1 vs P2. Do not invent new sections.
- All UI copy: follow the doc's wording. Briefs from the user override the doc.
- State that must survive refresh goes through `src/lib/storage`, never raw
  `useState` alone and never direct `localStorage` calls in components.
- One task = one focused change. Do not refactor unrelated files.
- When fixing a bug: reproduce it first (describe repro steps), then fix, then
  verify. One bug = one small change.
- Legal pages (Privacy, Terms, Artist Terms, Impressum): footer links must resolve
  from day one; copy follows `docs/webpage-research.md`. Full terms are required
  before the site accepts real orders — flag this if asked to enable checkout.
- If a brief conflicts with these instructions, follow the brief and say what
  you overrode and why.
