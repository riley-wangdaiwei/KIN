import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import { resolveBoardPositions } from "./positions";

// Fit a slice of the board into a fixed preview frame, reusing the real
// board render (resolveBoardPositions + the same absolute-positioned
// elements as SharedCanvasView) scaled down with a transform.
//
// The preview renders names at a fixed size (see CanvasPreview)
// and text at a fixed 24px, so the box estimates below stay in sync with
// the CSS: change the sizes there, change them here too.
const PREVIEW_NAME_SIZE = 72;
const PREVIEW_TEXT_FONT_SIZE = 24;
const PREVIEW_TEXT_MAX_WIDTH = 560;
const PREVIEW_IMAGE_HEIGHT = 52;

function nameBox(person: CanvasPerson): { width: number; height: number } {
  const size = person.nameSize ?? PREVIEW_NAME_SIZE;
  const words = person.name.split(" ");
  const width =
    person.name.length * size * 0.55 + Math.max(0, words.length - 1) * size * 0.2;
  return { width, height: Math.round(size * 1.1) + 24 };
}

function entryBox(entry: CanvasEntry): { width: number; height: number } {
  if (entry.kind === "text") {
    const fontSize = entry.fontSize ?? PREVIEW_TEXT_FONT_SIZE;
    const charsPerLine = Math.max(
      8,
      Math.floor(PREVIEW_TEXT_MAX_WIDTH / (fontSize * 0.5)),
    );
    const lines = Math.max(1, Math.ceil(entry.content.length / charsPerLine));
    return {
      width: Math.min(
        PREVIEW_TEXT_MAX_WIDTH,
        Math.max(48, Math.min(entry.content.length, charsPerLine) * fontSize * 0.5),
      ),
      height: lines * fontSize * 1.22,
    };
  }
  const height = entry.imageSize ?? PREVIEW_IMAGE_HEIGHT;
  return { width: height, height };
}

export interface BoardFit {
  scale: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  originX: number;
  originY: number;
}

export function fitBoardToFrame(
  people: CanvasPerson[],
  unsorted: GiftingCanvas["unsorted"],
  frameWidth: number,
  frameHeight: number,
): BoardFit {
  const board = resolveBoardPositions(people, unsorted);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number, box: { width: number; height: number }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + box.width);
    maxY = Math.max(maxY, y + box.height);
  };

  for (const person of people) {
    const position = board.personPositions.get(person.id) ?? { x: 16, y: 16 };
    include(position.x, position.y, nameBox(person));
  }
  for (const entry of [...unsorted, ...people.flatMap((person) => person.entries)]) {
    const position = board.entryPositions.get(entry.id) ?? { x: 16, y: 16 };
    include(position.x, position.y, entryBox(entry));
  }

  // Empty slice: a small blank box, centered.
  if (!Number.isFinite(minX)) {
    return { scale: 1, width: 0, height: 0, offsetX: 0, offsetY: 0, originX: 0, originY: 0 };
  }

  const margin = 16;
  const originX = minX - margin;
  const originY = minY - margin;
  const width = maxX - minX + margin * 2;
  const height = maxY - minY + margin * 2;
  const scale = Math.min(frameWidth / width, frameHeight / height, 1);
  return {
    scale,
    width,
    height,
    offsetX: (frameWidth - width * scale) / 2 - originX * scale,
    offsetY: (frameHeight - height * scale) / 2 - originY * scale,
    originX,
    originY,
  };
}
