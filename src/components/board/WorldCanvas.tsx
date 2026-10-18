"use client";

import type { DragEvent } from "react";
import type { TasteTag } from "@/features/taste/types";
import type {
  BoardStickerKind,
  WorldFrame,
  WorldSticker,
} from "@/features/world/types";
import DraggableSticker from "./DraggableSticker";
import DraggableLabel from "./DraggableLabel";
import ResizableFrame from "./ResizableFrame";
import styles from "./board.module.css";

interface WorldCanvasProps {
  tags: TasteTag[];
  frames: WorldFrame[];
  stickers: WorldSticker[];
  demoPreview?: boolean;
  dimmed?: boolean;
  onDropLabel: (label: string, x: number, y: number) => void;
  onDropFrame: (title: string, x: number, y: number) => void;
  onDropSticker: (
    kind: BoardStickerKind,
    title: string,
    x: number,
    y: number,
  ) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onDeleteLabel: (id: string) => void;
  onMoveFrame: (id: string, x: number, y: number) => void;
  onResizeFrame: (id: string, width: number, height: number) => void;
  onDeleteFrame: (id: string) => void;
  onMoveSticker: (id: string, x: number, y: number) => void;
  onDeleteSticker: (id: string) => void;
}

export default function WorldCanvas({
  demoPreview = false,
  dimmed = false,
  frames,
  onDeleteFrame,
  onDeleteLabel,
  onDeleteSticker,
  onDropFrame,
  onDropLabel,
  onDropSticker,
  onMoveFrame,
  onMoveLabel,
  onMoveSticker,
  onResizeFrame,
  stickers,
  tags,
}: WorldCanvasProps) {
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, event.clientX - bounds.left - 12);
    const y = Math.max(0, event.clientY - bounds.top - 12);
    const frame = event.dataTransfer.getData("application/x-kin-frame");
    const stickerKind = event.dataTransfer.getData(
      "application/x-kin-sticker-kind",
    ) as BoardStickerKind;
    const stickerTitle = event.dataTransfer.getData(
      "application/x-kin-sticker-title",
    );
    const label = event.dataTransfer.getData("text/plain");

    if (frame) {
      onDropFrame(frame, x, y);
    } else if (
      stickerTitle &&
      ["ticket", "paperclip", "photo"].includes(stickerKind)
    ) {
      onDropSticker(stickerKind, stickerTitle, x, y);
    } else if (label) {
      onDropLabel(label, x, y);
    }
  }

  return (
    <div
      className={`${styles.canvasWrap} ${dimmed ? styles.canvasDimmed : ""}`}
      data-demo={demoPreview ? "true" : undefined}
    >
      <div
        className={styles.canvas}
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        role="region"
        aria-label="Your board canvas"
      >
        {frames.map((frame) => (
          <ResizableFrame
            key={frame.id}
            frame={frame}
            onMove={onMoveFrame}
            onResize={onResizeFrame}
            onDelete={onDeleteFrame}
          />
        ))}
        {tags.map((tag) => (
          <DraggableLabel
            key={tag.id}
            tag={tag}
            onMove={onMoveLabel}
            onDelete={onDeleteLabel}
          />
        ))}
        {stickers.map((sticker) => (
          <DraggableSticker
            key={sticker.id}
            sticker={sticker}
            onMove={onMoveSticker}
            onDelete={onDeleteSticker}
          />
        ))}
        {tags.length === 0 && frames.length === 0 && stickers.length === 0 && (
          <div className={styles.canvasEmpty}>
            <span className={styles.microLabel}>A space to begin</span>
            <p>Drop a thought here. It can find its place later.</p>
          </div>
        )}
        <span className={styles.canvasIndex} aria-hidden="true">
          KIN / BOARD 001
        </span>
      </div>
    </div>
  );
}
