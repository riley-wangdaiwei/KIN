# KIN coding instructions

## Product and source of truth

- Read `PRODUCT.md` for the product one-liner.
- Read `docs/mvp-structure.md` before building product pages; it defines the sitemap and priorities.
- Read `docs/design-protocol.md` before changing visual design.
- Follow `docs/builders-protocol.md` for the project structure.
- Treat `docs/design-protocol.md` and the tokens/components in `src/app/globals.css` and `src/components/editorial/` as the visual source of truth for every UI task.

## Architecture

- `src/app/`: one folder per route; pages compose the UI and contain no domain logic.
- `src/components/`: UI only; no data fetching and no direct storage access.
- `src/features/`: domain types and pure functions; no UI.
- `src/data/`: seed and demo data.
- `src/lib/storage/`: the persistence seam. Use `StorageAdapter`; UI must never access `localStorage` directly.
- Mantra: pages compose, features compute, components render, storage persists.

## Visual system

- Use the KIN Editorial Magazine tokens and base components; preview them at `/design-preview`.
- Prefer editorial density, serif display headlines, compact uppercase metadata, asymmetrical image/text layouts, fine rules, and controlled whitespace.
- Use the accent sparingly. Keep photographic foreground text readable with the dark image overlay.
- Avoid generic SaaS layouts, repeated rounded cards, decorative gradients, and centered headlines above three equal cards.
- Keep functional areas, especially the curation board, clear and usable; editorial expression must not compromise accessibility or touch targets.

Do not add product pages until explicitly requested. Keep each change focused and preserve existing behavior.

## Validation

- Run `npm run typecheck` and `npm run lint` for relevant code changes.
- Run `npm run build` when validating a production-ready change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
