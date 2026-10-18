"use client";

import Draggable from "react-draggable";
import { useRef, useState, type PointerEvent } from "react";
import type { WorldFrame } from "@/features/world/types";
import styles from "./board.module.css";

interface ResizableFrameProps {
  frame: WorldFrame;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
}

export default function ResizableFrame({
  frame,
  onDelete,
  onMove,
  onResize,
}: ResizableFrameProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const renderedWidth = size?.width ?? frame.width;
  const renderedHeight = size?.height ?? frame.height;

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = renderedWidth;
    const startHeight = renderedHeight;
    let width = startWidth;
    let height = startHeight;

    const move = (moveEvent: globalThis.PointerEvent) => {
      width = Math.max(180, startWidth + moveEvent.clientX - startX);
      height = Math.max(110, startHeight + moveEvent.clientY - startY);
      setSize({ width, height });
    };

    const finish = () => {
      onResize(frame.id, width, height);
      setSize(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: frame.x, y: frame.y }}
      bounds="parent"
      onStop={(_, position) => onMove(frame.id, position.x, position.y)}
      cancel={`.${styles.frameControl}`}
    >
      <section
        ref={nodeRef}
        className={styles.boardFrame}
        style={{ width: renderedWidth, height: renderedHeight }}
        aria-label={`Frame: ${frame.title}`}
      >
        <div className={styles.frameHeader}>
          <span className={styles.frameTitle}>{frame.title}</span>
          <button
            className={`${styles.frameControl} ${styles.elementDelete}`}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onDelete(frame.id)}
            aria-label={`Delete ${frame.title}`}
          >
            ×
          </button>
        </div>
        <button
          className={`${styles.frameControl} ${styles.resizeHandle}`}
          type="button"
          onPointerDown={startResize}
          aria-label={`Resize ${frame.title}`}
        />
      </section>
    </Draggable>
  );
}
