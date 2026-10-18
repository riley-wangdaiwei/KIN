export type GiftCategory =
  | "hero"
  | "kin-meal"
  | "artist-made"
  | "supporting-gift";

export type GiftAction = "start-brief" | "preorder-intent" | "artist-inquiry";

export interface GiftPackage {
  slug: string;
  title: string;
  category: GiftCategory;
  eyebrow: string;
  summary: string;
  introduction: string;
  example: string;
  heroGift: string;
  fillings: string[];
  personalMessage: string;
  readmeGuide: string[];
  artistProcessNote: string;
  occasions: string[];
  included: string[];
  provide: string[];
  process: string[];
  customization: string[];
  deliveryTime: string;
  usageScope: string;
  priceAndAvailability: string;
  action: GiftAction;
  actionLabel: string;
  heroMark: string;
}

export interface SupportingGift {
  title: string;
  kind: "digital" | "physical" | "licensed";
  description: string;
}

export interface GiftIntent {
  slug: string;
  createdAt: string;
}
