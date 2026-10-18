"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import type { WorldSticker } from "@/features/world/types";
import styles from "./board.module.css";

interface DraggableStickerProps {
  sticker: WorldSticker;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

const stickerGlyphs: Record<WorldSticker["kind"], string> = {
  ticket: "ADMIT ONE",
  paperclip: "⌁",
  photo: "▧",
};

export default function DraggableSticker({
  onDelete,
  onMove,
  sticker,
}: DraggableStickerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: sticker.x, y: sticker.y }}
      bounds="parent"
      onStop={(_, position) => onMove(sticker.id, position.x, position.y)}
    >
      <div
        className={`${styles.boardSticker} ${styles[`boardSticker_${sticker.kind}`]}`}
        ref={nodeRef}
        aria-label={`${sticker.title}, draggable decoration`}
      >
        <span aria-hidden="true">{stickerGlyphs[sticker.kind]}</span>
        <button
          className={styles.elementDelete}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(sticker.id)}
          aria-label={`Remove ${sticker.title}`}
        >
          ×
        </button>
      </div>
    </Draggable>
  );
}
