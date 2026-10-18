import type { TasteProfile } from "@/features/taste/types";
import type { World } from "@/features/world/types";
import type { GiftBrief } from "@/features/brief/types";
import type { GiftIntent } from "@/features/gifts/types";

export interface StorageAdapter {
  getTaste(): TasteProfile | null;
  saveTaste(taste: TasteProfile): void;
  getWorld(): World | null;
  saveWorld(world: World): void;
  getBoardIntroSeen(): boolean;
  saveBoardIntroSeen(seen: boolean): void;
  getGiftBrief(): GiftBrief | null;
  saveGiftBrief(brief: GiftBrief): void;
  getGiftIntents(): GiftIntent[];
  saveGiftIntent(intent: GiftIntent): void;
}
