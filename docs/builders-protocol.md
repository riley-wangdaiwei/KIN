# Builders Protocol
(Source: Drive doc "Builders Protocol")

# Maintenance Protocol

Folder Tree:

recurate/                              <- repo root (github.com/riley-wangdaiwei/recurate, Vercel auto-deploys main)

|-- src/

|   |-- app/                           <- ROUTES: one folder per URL. Pages only, NO logic here.

|   |   |-- page.tsx                   <- /                 home = My World canvas

|   |   |-- layout.tsx                 <- shared layout (nav)

|   |   |-- onboarding/page.tsx        <- /onboarding      taste quiz -> saves taste -> goes home

|   |   |-- organize/page.tsx          <- /organize        tag-pack shop (priced packs)

|   |   |-- explore/page.tsx           <- /explore

|   |   |-- explore/games/page.tsx     <- /explore/games   (uses storage: getTaste/saveTaste)

|   |   |-- artists/page.tsx           <- /artists          artist list

|   |   |-- artists/[slug]/page.tsx    <- /artists/:slug    artist profile

|   |   |-- gift/page.tsx              <- /gift             gift basket (curated from taste via CommerceService)

|   |   |-- invite/page.tsx            <- /invite

|   |   |-- unlock-all/page.tsx        <- /unlock-all

|   |   |-- api/health/route.ts        <- GET health check; future webhooks plug in here

|   |   |-- globals.css / site.module.css / favicon.ico

|   |-- components/                    <- UI ONLY: dumb components, no data fetching

|   |   |-- world/                     <- WorldWorkspace, WorldCanvas, TagGroup, StickerTray,

|   |   |                                CreateGroup, DraggableSticker, ResizableFrame, UnlockPanel

|   |   |-- onboarding/                <- WordDuel, OwnWordsForm

|   |   |-- artists/                   <- ArtistCard, ArtistBlog

|   |   |-- gift/                      <- GiftBasket (+ GiftBasket.module.css)

|   |   |-- invite/                    <- InvitePanel

|   |   `-- layout/                    <- Navigation, DraggableTag

|   |-- features/                      <- DOMAIN LOGIC: pure functions + types, no UI

|   |   |-- taste/                     <- types.ts, engine.ts (duels), service.ts (profile)

|   |   |-- world/                     <- types.ts, service.ts (createWorld, moveTag)

|   |   |-- artists/                   <- types.ts ONLY (no logic yet)

|   |   |-- commerce/                  <- types.ts + interface.ts (CommerceService) + mock-service.ts

|   |   |-- social/                    <- types.ts ONLY -> NEXT: add service.ts + mock impl

|   |-- data/                          <- seed/demo data (dies when a real backend arrives)

|   |   |-- seed-artists.ts, seed-drops.ts, seed-stickers.ts, seed-tags.ts, duel-pairs.ts

|   |-- lib/

|       |-- storage/                   <- ** THE SEAM: UI never touches localStorage directly

|       |-- interface.ts               <- StorageAdapter: getTaste/saveTaste/getWorld/saveWorld

|       |-- local-adapter.ts           <- current impl (localStorage)

|       |-- index.ts + supabase-adapter.ts <- exports `storage`; supabase stub exists, not wired yet

|-- public/                            <- static images / patterns

|-- AGENTS.md / CLAUDE.md              <- instructions for AI coding agents - KEEP UPDATED

|-- PRODUCT.md                         <- product one-liner

|-- next.config.ts                     <- Next 16: Codex MUST read node_modules/next/dist/docs first!

|-- package.json                       <- next 16, react 19, react-draggable

RULES: pages compose, features compute, components render, storage persists.

New feature = new folder under features/. Old code stays untouched.

Maintenance:

Collect the complaint - write down what the user SAW vs what they EXPECTED, in their own words. Don't translate it into tech yet.

Ask about where it lives - describe the symptom; AI agent points to the exact folder / file / function and the shape of the fix. Never guess the location yourself.

Reproduce it first - make the bug happen on your screen (localhost or the Vercel preview) BEFORE touching code. If you can't reproduce it, you can't prove you fixed it.

Make the change - one bug = one small, focused change. Paste Mu's brief into Codex for the edit; do it yourself when you want the practice.

Test the fix - redo the reproduce steps, then click around the whole affected page. Nothing else broke? Good.

Push to GitHub (main branch) - Vercel deploys automatically. Then check the LIVE site, not just localhost.

Close the loop - update the bug entry below (fixed / still open), and tell the person who reported it.

---

# Bugs Journal

How to record bugs

Copy this template for every bug. One bug = one entry. No entry = the bug doesn't exist.

Title: <one line - what the user sees>

Page / route: <e.g. /gift , / (home canvas)>

Folder & file: <e.g. src/components/world/WorldWorkspace.tsx>

What happens vs what should happen: <...>

How to reproduce: <1. ...  2. ...  3. ...>

Status: open / fixing / fixed

Found on: <date>

---------------- OPEN BUGS ----------------

[1] Groups & frames disappear on refresh

Page / route: / (home canvas)

Folder & file: src/components/world/WorldWorkspace.tsx - groups & frames are local useState, never saved

What happens vs what should happen: groups/frames created on the canvas vanish on refresh; they should persist via storage.saveWorld, like tags/stickers already do

How to reproduce: 1. Open /  2. Create a group  3. Refresh the page -> the group is gone

Status: open

[2] Gift page ignores the user's taste

Page / route: /gift

Folder & file: src/app/gift/page.tsx + src/components/gift/GiftBasket.tsx - renders seedDrops directly

What happens vs what should happen: /gift always shows seed data; it should curate items from the taste profile in storage

How to reproduce: 1. Finish onboarding  2. Open /gift -> items don't reflect your tags

Status: open

[3] Live order flow cannot reach confirmation

Page / route: /order

Folder & file: Vercel Production environment configuration for src/app/api/orders/route.ts

What happens vs what should happen: When email settings are absent, the API now logs the validated order payload server-side and returns success without sending email, so the buyer reaches Confirmation. When all settings are present, the API sends the order and buyer confirmation emails; however, the current live KIN_FROM_EMAIL uses an unverified gmail.com domain, so Resend rejects the order email. Configure a sender on a domain verified in Resend before expecting live email delivery.

How to reproduce: 1. With all email environment variables unset, submit a valid order and confirm the API returns its order ID without calling Resend. 2. With the current live settings, submit an authorized test order; the live order API returns 502 with Resend's unverified gmail.com sender-domain error.

Status: open for live email delivery — the no-email fallback is implemented; a verified Resend sender domain is still required before the live order and buyer confirmation emails can succeed. The single authorized test attempt did not send either email.

----------------

---------------- FIXED ----------------

[BUG 2026-10-02] Groups & frames lost on refresh - FIXED

Where: src/components/world/WorldWorkspace.tsx (home page /)

Saw: Create a group or move/resize a frame on the canvas, refresh the page - groups and frames are gone. Tags and stickers survive, groups/frames don't.

Expected: Everything on the canvas persists across refreshes.

Root cause: groups and frames lived in local React useState inside WorldWorkspace and never went through the storage seam. Two components (WorldWorkspace, WorldCanvas) also shared one storage key with independent writes, so either could clobber the other.

Fix: World type gained a frames field (src/features/world/types.ts); world/service.ts gained pure helpers addGroup/addFrame/updateFrame/deleteFrame/mergeWorld; WorldWorkspace now loads/saves groups+frames via storage with read-modify-write (mergeWorld) so it never clobbers stickers; WorldCanvas.persistStickers does the same in reverse. Old saves migrate with ?? [] defaults.

Repro: 1. Open home page. 2. Create a group, drag/resize its frame. 3. Refresh - group and frame are still there.

Status: fixed 2026-10-02 (commits c8ae1dd, ec59190 on master)

[BUG 2026-10-02] Gift page ignores user taste - FIXED

Where: src/app/gift/page.tsx (/gift)

Saw: /gift always shows the same two seed items no matter what the taste quiz answers were. The curation loop (taste -> artist picks) wasn't wired at all.

Expected: Gift picks reflect the visitor's taste tags.

Root cause: page rendered seedDrops directly; commerce/ was types-only with no service layer.

Fix: Added CommerceService interface (src/features/commerce/interface.ts) + mock-service.ts that scores catalog items by tag overlap between artist tags and the user's taste profile; new GiftPageClient component loads the taste profile from storage and renders the curated list. Swap mock for Stripe-backed impl later without touching UI.

Repro: 1. Do onboarding (pick words). 2. Open /gift - items are ordered by overlap with your tags; a "CURATED FROM YOUR N TASTE TAGS" line appears.

Status: fixed 2026-10-02 (commits 89244f5, 8714c78, 7974afc on master)

---

# Updates Journal

How to record updates

Bugs are must-fix; updates are want-to-improve. Copy this template for every update. One update = one entry. No entry = the idea doesn't exist.

Title: <one line - the improvement>

Page / route: <e.g. /gift , / (home canvas)>

Folder & file: <e.g. src/features/commerce/mock-service.ts - where the change would live>

What it is now vs what we want: <...>

Why: <user feedback? business need? design polish? - the reason to do it>

Priority: now / soon / later

Status: idea / planned / doing / done

Proposed on: <date>

---------------- IDEAS ----------------

---------------- PLANNED ----------------

---------------- DONE ----------------

---

# Useful Tools

www.framer.com 

Framer to code https://www.framer.com/marketplace/plugins/framer-to-code/ 

A lot of visuals https://www.framer.com/marketplace/search/?q=text&type=component we can imitate

Shovel https://www.shovel.studio/ — elevated Shopify/DTC design studio, design-system approach we can imitate