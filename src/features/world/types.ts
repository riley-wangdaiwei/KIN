export type WorldItem = Record<string, unknown>;

export interface World {
  stickers: WorldItem[];
  groups: WorldItem[];
  frames: WorldItem[];
}
