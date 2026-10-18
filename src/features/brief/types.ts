export type GiftIntent =
  | "Something I find hard to say"
  | "A memory worth keeping"
  | "What makes them special"
  | "A world only we share";

export type BriefSection = "me" | "them" | "gift";

export interface BriefMaterial {
  key: string;
  text: string;
}

export interface GiftCurationAnswers {
  selected: Record<BriefSection, string[]>;
  intent: GiftIntent | null;
  note: string;
}

export interface GiftBrief {
  me: string;
  them: string;
  gift: string;
}
