import type { User } from "@supabase/supabase-js";
import type { CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import type { CanvasPublication } from "@/lib/storage/canvas-adapter";

// The profile page's canvas directory.
//
// The data model has ONE canvas per user account (canvas_people +
// canvas_entries on a single board), not one canvas row per person —
// there is no per-person canvas, no per-person publish, and no gift
// link on a canvas yet. So the directory is user-managed:
//   - the whole board first ("Your canvas", or the publication name when
//     the user has published it), and
//   - one entry per canvas the user names with the "+" under the list
//     (profile_canvases rows). A row linked to a person on the board
//     shows that person's slice of the board; an unlinked row is a named
//     canvas with an empty preview for now.
// People on the board are NEVER auto-added as directory entries — the
// user adds canvases herself.
export interface ProfileGift {
  title: string;
  image: string;
  artist: string;
  href: string;
}

// One named canvas from profile_canvases: a row the user added, with the
// board person it links to (null when it links to nobody).
export interface ProfileCanvas {
  id: string;
  name: string;
  personId: string | null;
}

export interface ProfileDirectoryEntry {
  id: string;
  label: string;
  kind: "board" | "userCanvas";
  people: CanvasPerson[];
  unsorted: GiftingCanvas["unsorted"];
  entryCount: number;
  gift?: ProfileGift;
}

// PLACEHOLDER — no gift exists in the data yet (the first loop has not
// produced one), so the gift slot is wired to a sample gift on the board
// entry only, so the design is visible. Remove PLACEHOLDER_GIFT from the
// board entry and attach real gifts when a canvas gains a linked gift.
export const PLACEHOLDER_GIFT: ProfileGift = {
  title: "Conversation Recap",
  image: "/gift_conversation.jpg",
  artist: "Rhema",
  href: "/gifts/conversation-recap",
};

export function buildProfileDirectory(
  canvas: GiftingCanvas,
  publication: CanvasPublication | null,
  profileCanvases: ProfileCanvas[] = [],
): ProfileDirectoryEntry[] {
  const entries: ProfileDirectoryEntry[] = [
    {
      id: "board",
      label: publication?.name ?? "Your canvas",
      kind: "board",
      people: canvas.people,
      unsorted: canvas.unsorted,
      entryCount:
        canvas.people.reduce((sum, person) => sum + person.entries.length, 0) +
        canvas.unsorted.length,
      // PLACEHOLDER gift — see PLACEHOLDER_GIFT above.
      gift: PLACEHOLDER_GIFT,
    },
  ];
  for (const row of profileCanvases) {
    const person = row.personId
      ? canvas.people.find((candidate) => candidate.id === row.personId) ?? null
      : null;
    entries.push({
      id: `canvas:${row.id}`,
      label: row.name,
      kind: "userCanvas",
      people: person ? [person] : [],
      unsorted: [],
      entryCount: person ? person.entries.length : 0,
    });
  }
  return entries;
}

// Display name, mirroring the header (PlaygroundChrome): the name from
// sign-up metadata, else the part of the email before the "@".
export function profileDisplayName(user: User | null): string {
  if (!user) return "guest";
  const metadataName = user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName !== "") return metadataName;
  return user.email?.split("@")[0] ?? "guest";
}

// Suggested gifting-style keywords for the "+" picker. Seeded from the
// gift quiz vocabulary (src/features/quiz/quiz.ts: the result types and
// the Q03/Q04/Q05 answer options, distilled to short keywords) plus a few
// generic ones. The user has not approved this list — she should correct
// it. Picked styles save to user_gifting_styles and persist.
export const SUGGESTED_GIFTING_STYLES: string[] = [
  // Q03 — their perfect Sunday.
  "bookish",
  "explorer",
  "maker",
  "long dinners",
  // Q04 — the kind of person they are.
  "tiny things",
  "niche obsessions",
  "shared stories",
  // Q05 — if they were a weather.
  "golden hour",
  "first snow",
  "summer storm",
  "soft rain",
  // The quiz result types, as gift forms.
  "a poem",
  "shared places",
  "a photo album",
  // Generic.
  "handmade",
  "personal",
];

// Seed styles shown when the user has none saved yet. On first load the
// page saves these three into user_gifting_styles (best effort); after
// that the saved list is the truth, and additions and removals persist.
export const SEED_GIFTING_STYLES: string[] = [
  "handmade",
  "tiny things",
  "golden hour",
];

// PLACEHOLDER — artists the user has worked with. No collaboration data
// exists yet, so this is a stand-in name until real data lands.
export const PLACEHOLDER_ARTISTS: string[] = ["Rhema"];

// PLACEHOLDER — fake numbers for features that do not exist yet (tokens,
// subscription level, follows). Replace with real data when those
// features land; do not treat these as the user's real counts.
export const PLACEHOLDER_PROFILE_STATS = {
  tokens: 42,
  subscription: "Trial",
  following: 3,
  followers: 5,
};
