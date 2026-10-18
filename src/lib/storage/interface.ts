import type { TasteProfile } from "@/features/taste/types";
import type { World } from "@/features/world/types";

export interface StorageAdapter {
  getTaste(): TasteProfile | null;
  saveTaste(taste: TasteProfile): void;
  getWorld(): World | null;
  saveWorld(world: World): void;
}
