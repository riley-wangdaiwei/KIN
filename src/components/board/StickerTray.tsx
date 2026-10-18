"use client";

import type { DragEvent } from "react";
import type { BoardStickerKind } from "@/features/world/types";
import styles from "./board.module.css";

interface StickerTrayProps {
  items: { kind: BoardStickerKind; title: string }[];
}

const stickerGlyphs: Record<BoardStickerKind, string> = {
  ticket: "ADMIT ONE",
  paperclip: "⌁",
  photo: "▧",
};

export default function StickerTray({ items }: StickerTrayProps) {
  function startDrag(
    event: DragEvent<HTMLButtonElement>,
    item: StickerTrayProps["items"][number],
  ) {
    event.dataTransfer.setData("application/x-kin-sticker-kind", item.kind);
    event.dataTransfer.setData("application/x-kin-sticker-title", item.title);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <section className={styles.tray} aria-labelledby="sticker-tray-heading">
      <h3 className={styles.microLabel} id="sticker-tray-heading">
        Small marks / drag onto board
      </h3>
      <div className={styles.stickerList}>
        {items.map((item) => (
          <button
            className={styles.stickerSource}
            key={item.kind}
            type="button"
            draggable
            onDragStart={(event) => startDrag(event, item)}
          >
            <span
              className={`${styles.stickerGlyph} ${styles[`stickerGlyph_${item.kind}`]}`}
              aria-hidden="true"
            >
              {stickerGlyphs[item.kind]}
            </span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
