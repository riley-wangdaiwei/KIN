import type { CanvasEntry, CanvasPerson } from "./types";

export type BoardPosition = { x: number; y: number };

export type BoardLayout = {
  personPositions: Map<string, BoardPosition>;
  entryPositions: Map<string, BoardPosition>;
  contentHeight: number;
};

const BOARD_MARGIN = 16;
const NAME_HEIGHT = 180;
const TEXT_HEIGHT = 64;
const IMAGE_HEIGHT = 260;

function estimatedHeight(kind: "name" | "text" | "image" | "sticker"): number {
  if (kind === "name") return NAME_HEIGHT;
  if (kind === "text") return TEXT_HEIGHT;
  return IMAGE_HEIGHT;
}

/**
 * Board positions for every person name and entry. Stored positions win;
 * anything without one stacks top-to-bottom in load order so existing
 * content is never lost when the board first opens.
 */
export function resolveBoardPositions(
  people: CanvasPerson[],
  unsorted: CanvasEntry[],
): BoardLayout {
  const personPositions = new Map<string, BoardPosition>();
  const entryPositions = new Map<string, BoardPosition>();
  let cursor = BOARD_MARGIN;

  const place = (
    map: Map<string, BoardPosition>,
    id: string,
    storedX: number | null,
    storedY: number | null,
    height: number,
  ) => {
    if (storedX !== null && storedY !== null) {
      map.set(id, { x: storedX, y: storedY });
      return;
    }
    map.set(id, { x: BOARD_MARGIN, y: cursor });
    cursor += height + 24;
  };

  for (const person of people) {
    place(
      personPositions,
      person.id,
      person.posX,
      person.posY,
      person.nameSize ? Math.round(person.nameSize * 1.1) + 24 : NAME_HEIGHT,
    );
    for (const entry of person.entries) {
      place(
        entryPositions,
        entry.id,
        entry.posX,
        entry.posY,
        estimatedHeight(entry.kind),
      );
    }
  }
  for (const entry of unsorted) {
    place(
      entryPositions,
      entry.id,
      entry.posX,
      entry.posY,
      estimatedHeight(entry.kind),
    );
  }

  return {
    personPositions,
    entryPositions,
    contentHeight: Math.max(cursor + 240, 600),
  };
}
