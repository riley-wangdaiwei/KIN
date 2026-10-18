import type { StorageAdapter } from "./interface";
import type { TasteProfile } from "@/features/taste/types";
import type { World } from "@/features/world/types";
import type { GiftBrief } from "@/features/brief/types";
import type { GiftIntent } from "@/features/gifts/types";

const keys = {
  taste: "kin:taste",
  world: "kin:world",
  boardIntroSeen: "kin:board-intro-seen",
  giftBrief: "kin:gift-brief",
  giftIntents: "kin:gift-intents",
} as const;

function getBrowserStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Local storage is only available in a browser.");
  }

  return window.localStorage;
}

function read<T>(key: string): T | null {
  const serialized = getBrowserStorage().getItem(key);
  return serialized === null ? null : (JSON.parse(serialized) as T);
}

function write<T>(key: string, value: T): void {
  getBrowserStorage().setItem(key, JSON.stringify(value));
}

export const localAdapter: StorageAdapter = {
  getTaste: () => read<TasteProfile>(keys.taste),
  saveTaste: (taste) => write(keys.taste, taste),
  getWorld: () => read<World>(keys.world),
  saveWorld: (world) => write(keys.world, world),
  getBoardIntroSeen: () => read<boolean>(keys.boardIntroSeen) ?? false,
  saveBoardIntroSeen: (seen) => write(keys.boardIntroSeen, seen),
  getGiftBrief: () => read<GiftBrief>(keys.giftBrief),
  saveGiftBrief: (brief) => write(keys.giftBrief, brief),
  getGiftIntents: () => read<GiftIntent[]>(keys.giftIntents) ?? [],
  saveGiftIntent: (intent) => {
    const existing = read<GiftIntent[]>(keys.giftIntents) ?? [];
    if (!existing.some((saved) => saved.slug === intent.slug)) {
      write(keys.giftIntents, [...existing, intent]);
    }
  },
};
