import type { GiftBrief } from "@/features/brief/types";

const missingBriefText = [
  "My perspective is still taking shape.",
  "I am still gathering what makes them uniquely them.",
];

export function isGiftBriefThin(brief: GiftBrief | null): boolean {
  if (!brief) return true;

  const meaningfulSections = [brief.me, brief.them, brief.gift].filter(
    (section) => {
      const normalized = section.trim().toLowerCase();
      return (
        normalized.length >= 20 &&
        !missingBriefText.some((fallback) => fallback.toLowerCase() === normalized)
      );
    },
  );

  return meaningfulSections.length < 2;
}
