export type CanvasEntryKind = "text" | "image" | "sticker";

export interface CanvasEntry {
  id: string;
  personId: string | null;
  relatedEntryId: string | null;
  kind: CanvasEntryKind;
  content: string;
  storagePath: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CanvasPerson {
  id: string;
  name: string;
  createdAt: string;
  entries: CanvasEntry[];
}

export interface GiftingCanvas {
  people: CanvasPerson[];
  unsorted: CanvasEntry[];
}

export interface SharedCanvas {
  person: Pick<CanvasPerson, "id" | "name"> | null;
  people: CanvasPerson[];
  unsorted: CanvasEntry[];
}

export function groupPeopleIntoColumns(
  people: CanvasPerson[],
): [CanvasPerson[], CanvasPerson[], CanvasPerson[]] {
  const columnLength = Math.ceil(people.length / 3);
  return [
    people.slice(0, columnLength),
    people.slice(columnLength, columnLength * 2),
    people.slice(columnLength * 2),
  ];
}
