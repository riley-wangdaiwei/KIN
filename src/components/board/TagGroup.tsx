"use client";

import type { DragEvent } from "react";
import styles from "./board.module.css";

const FRAME_TRANSFER_TYPE = "application/x-kin-frame";

interface TagGroupProps {
  title: string;
  onAdd: (title: string) => void;
}

export default function TagGroup({ title, onAdd }: TagGroupProps) {
  function startDrag(event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.setData(FRAME_TRANSFER_TYPE, title);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <button
      className={styles.presetFrame}
      type="button"
      draggable
      onDragStart={startDrag}
      onClick={() => onAdd(title)}
    >
      <span className={styles.presetFrameMark} aria-hidden="true">＋</span>
      <span>{title}</span>
    </button>
  );
}
