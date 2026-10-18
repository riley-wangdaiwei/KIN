export interface WorldFrame {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorldGroup {
  id: string;
  title: string;
  tagIds: string[];
  createdAt: string;
}

export type BoardStickerKind = "ticket" | "paperclip" | "photo";

export interface WorldSticker {
  id: string;
  kind: BoardStickerKind;
  title: string;
  x: number;
  y: number;
}

export interface World {
  stickers: WorldSticker[];
  groups: WorldGroup[];
  frames: WorldFrame[];
}
