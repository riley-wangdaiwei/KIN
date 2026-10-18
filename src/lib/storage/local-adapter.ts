import type { StorageAdapter } from "./interface";
import type { TasteProfile } from "@/features/taste/types";
import type { World } from "@/features/world/types";

const keys = {
  taste: "kin:taste",
  world: "kin:world",
  boardIntroSeen: "kin:board-intro-seen",
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
};
