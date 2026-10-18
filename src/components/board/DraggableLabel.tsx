"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import type { TasteTag } from "@/features/taste/types";
import styles from "./board.module.css";

interface DraggableLabelProps {
  tag: TasteTag;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export default function DraggableLabel({
  onDelete,
  onMove,
  tag,
}: DraggableLabelProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: tag.x, y: tag.y }}
      bounds="parent"
      onStop={(_, position) => onMove(tag.id, position.x, position.y)}
    >
      <div ref={nodeRef} className={styles.boardLabel}>
        <button
          className={styles.boardLabelText}
          type="button"
          aria-label={`${tag.label}, draggable note`}
        >
          {tag.label}
        </button>
        <button
          className={styles.elementDelete}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(tag.id)}
          aria-label={`Delete ${tag.label}`}
        >
          ×
        </button>
      </div>
    </Draggable>
  );
}
