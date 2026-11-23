// Artists and partners shown on /artists. One entry per person — the wheel
// reads this list, so adding an artist or partner is one entry here.
//
// The list is Rhema Tan plus the homepage's artist/partner hover-list
// names, imported from src/data/hover-lists.ts (do not retype them here).
// Those hover-list names include placeholder/demo names (e.g. Virginia
// Woolf) — she can confirm or correct them. The gifts data spells the
// collection "Rhemma Meals" with a double m — left alone; the artist
// herself is Rhema.
//
// Rhema Tan is the only entry with photos (public/rhema_1/2/3.png).
// Artists without photos show only their caption on the right side —
// no photo area, no placeholder.
import { artistPartnerNames } from "@/data/hover-lists";

export type ArtistPhotos = {
  large: string;
  small: [string, string];
};

export type ArtistEntry = {
  id: string;
  name: string;
  region?: string;
  line?: string;
  photos?: ArtistPhotos;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const ARTISTS: ArtistEntry[] = [
  {
    id: "rhema-tan",
    name: "Rhema Tan",
    region: "United Kingdom",
    line: "你好 i like 辣酸豆角包",
    photos: { large: "/rhema_2.png", small: ["/rhema_1.png", "/rhema_3.png"] },
  },
  ...artistPartnerNames.map((name) => ({ id: slugify(name), name })),
];
