import type {
  BriefMaterial,
  GiftBrief,
  GiftCurationAnswers,
} from "./types";

function selectedText(keys: string[], materials: BriefMaterial[]): string {
  const selected = new Set(keys);
  return materials
    .filter((material) => selected.has(material.key))
    .map((material) => material.text)
    .join("; ");
}

export function createGiftBrief(
  answers: GiftCurationAnswers,
  materials: BriefMaterial[],
): GiftBrief {
  const me = selectedText(answers.selected.me, materials);
  const them = selectedText(answers.selected.them, materials);
  const giftMaterials = selectedText(answers.selected.gift, materials);
  const giftParts = [
    answers.intent ?? "An intention still taking shape",
    giftMaterials ? `Include: ${giftMaterials}` : "",
    answers.note.trim(),
  ].filter(Boolean);

  return {
    me: me || "My perspective is still taking shape.",
    them: them || "I am still gathering what makes them uniquely them.",
    gift: giftParts.join(". "),
  };
}
