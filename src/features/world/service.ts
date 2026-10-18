import type { TasteTag } from "@/features/taste/types";
import type { World, WorldFrame, WorldSticker } from "./types";

export function createWorld(): World {
  return {
    stickers: [],
    groups: [],
    frames: [],
  };
}

export function normalizeWorld(world: Partial<World> | null): World {
  return {
    stickers: world?.stickers ?? [],
    groups: world?.groups ?? [],
    frames: world?.frames ?? [],
  };
}

export function moveTag(tags: TasteTag[], id: string, x: number, y: number): TasteTag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, x, y } : tag));
}

export function updateFrame(
  frames: WorldFrame[],
  id: string,
  patch: Partial<Pick<WorldFrame, "x" | "y" | "width" | "height">>,
): WorldFrame[] {
  return frames.map((frame) => (frame.id === id ? { ...frame, ...patch } : frame));
}

export function updateSticker(
  stickers: WorldSticker[],
  id: string,
  patch: Partial<Pick<WorldSticker, "x" | "y">>,
): WorldSticker[] {
  return stickers.map((sticker) =>
    sticker.id === id ? { ...sticker, ...patch } : sticker,
  );
}

export function normalizeTasteTags(tags: unknown): TasteTag[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.flatMap((tag, index) => {
    if (typeof tag === "string") {
      return [
        {
          id: `legacy-${index}-${tag}`,
          label: tag,
          x: 32 + (index % 4) * 130,
          y: 100 + Math.floor(index / 4) * 70,
          groupIds: [],
          createdAt: new Date(0).toISOString(),
        },
      ];
    }

    if (
      typeof tag === "object" &&
      tag !== null &&
      "id" in tag &&
      typeof tag.id === "string" &&
      "label" in tag &&
      typeof tag.label === "string" &&
      ("x" in tag && (typeof tag.x === "number" || tag.x === undefined)) &&
      ("y" in tag && (typeof tag.y === "number" || tag.y === undefined)) &&
      ("groupIds" in tag &&
        (Array.isArray(tag.groupIds) ||
          tag.groupIds === undefined)) &&
      ("createdAt" in tag &&
        (typeof tag.createdAt === "string" || tag.createdAt === undefined))
    ) {
      return [
        {
          id: tag.id,
          label: tag.label,
          x: typeof tag.x === "number" ? tag.x : 32 + (index % 4) * 130,
          y: typeof tag.y === "number" ? tag.y : 100 + Math.floor(index / 4) * 70,
          groupIds:
            Array.isArray(tag.groupIds) &&
            tag.groupIds.every(
              (groupId: unknown) => typeof groupId === "string",
            )
              ? tag.groupIds
              : [],
          createdAt:
            typeof tag.createdAt === "string"
              ? tag.createdAt
              : new Date(0).toISOString(),
        },
      ];
    }

    return [];
  });
}
