# KIN coding instructions

Follow `AGENTS.md` and `docs/builders-protocol.md` for all code changes.
The product source of truth is `docs/mvp-structure.md`; the visual source of
truth is `docs/design-protocol.md`.

Keep route pages in `src/app/` presentation-only. Keep UI in
`src/components/`, pure domain logic and types in `src/features/`, seed data in
`src/data/`, and persistence behind `StorageAdapter` in `src/lib/storage/`.
Never access `localStorage` from UI code. Do not build product pages until
explicitly requested.
