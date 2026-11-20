import type { User } from "@supabase/supabase-js";
import type { CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import type { CanvasPublication } from "@/lib/storage/canvas-adapter";

// The profile page's canvas directory.
//
// The data model has ONE canvas per user account (canvas_people +
// canvas_entries on a single board), not one canvas row per person —
// there is no per-person canvas, no per-person publish, and no gift
// link on a canvas yet. So the directory is built from what exists:
//   - the whole board first ("Your canvas", or the publication name when
//     the user has published it), and
//   - one entry per person on the board — "a canvas for each person you
//     love", named after the person, showing that person's slice of the
//     board.
// What is missing for a true multi-canvas directory: a canvas record per
// person (name, owner, gift link) instead of slicing one shared board.
export interface ProfileGift {
  title: string;
  image: string;
  artist: string;
  href: string;
}

export interface ProfileDirectoryEntry {
  id: string;
  label: string;
  kind: "board" | "person";
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
  for (const person of canvas.people) {
    entries.push({
      id: person.id,
      label: person.name,
      kind: "person",
      people: [person],
      unsorted: [],
      entryCount: person.entries.length,
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
// it. There is no gifting-styles table yet, so picked styles live in page
// state only and do not persist.
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

// Seed styles shown on first load. Local state only — there is no
// gifting-styles table, so additions and removals do not persist.
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
