// Artists and partners shown on /artists. One entry per person — the wheel
// reads this list, so adding an artist or partner is one entry here.
//
// What the repo stores today: exactly ONE artist name — "Rhema"
// (src/features/profile/profile.ts PLACEHOLDER_ARTISTS + the gift artist;
// "Rhema meal" in src/app/gifts/page.tsx). The gifts data spells the
// collection "Rhemma Meals" with a double m — left alone; the artist
// herself is Rhema. No partner names are stored anywhere in the repo
// (the partner page names no one), so the wheel starts with Rhema Tan
// and grows as names are added here.
//
// Rhema Tan is the new entry: her photos live at public/rhema_1/2/3.png
// (uploaded separately). Artists without photos get a neutral placeholder
// on the right side instead.
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

export const ARTISTS: ArtistEntry[] = [
  {
    id: "rhema-tan",
    name: "Rhema Tan",
    region: "United Kingdom",
    line: "你好 i like 辣酸豆角包",
    photos: { large: "/rhema_2.png", small: ["/rhema_1.png", "/rhema_3.png"] },
  },
];
