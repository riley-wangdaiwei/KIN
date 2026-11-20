"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasEntry, GiftingCanvas } from "@/features/canvas/types";
import type { CanvasPerson } from "@/features/canvas/types";
import { resolveBoardPositions } from "@/features/canvas/positions";
import { fitBoardToFrame } from "@/features/canvas/preview";
import AlphabetName from "@/components/canvas/AlphabetName";
import styles from "./canvas-preview.module.css";

// A real scaled render of a slice of the board: the same absolute-positioned
// board elements SharedCanvasView renders (person names in the hand-drawn
// alphabet, text notes, images and stickers), laid out by
// resolveBoardPositions and scaled with a transform to fit the frame.
// Names render at a fixed size (the person's size, else 72px) and text at
// 24px so the fit math in features/canvas/preview.ts stays in sync.
export default function CanvasPreview({
  people,
  unsorted,
  label,
}: {
  people: CanvasPerson[];
  unsorted: GiftingCanvas["unsorted"];
  label: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 520, height: 293 });

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () =>
      setFrameSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const board = useMemo(
    () => resolveBoardPositions(people, unsorted),
    [people, unsorted],
  );
  const fit = useMemo(
    () => fitBoardToFrame(people, unsorted, frameSize.width, frameSize.height),
    [people, unsorted, frameSize],
  );

  const isEmpty = people.length === 0 && unsorted.length === 0;

  return (
    <div
      aria-hidden="true"
      className={styles.frame}
      data-testid="canvas-preview-frame"
      ref={frameRef}
    >
      {isEmpty ? (
        <p className={styles.empty}>Nothing on this canvas yet.</p>
      ) : (
        <div
          className={styles.board}
          style={{
            left: fit.offsetX,
            top: fit.offsetY,
            width: fit.width,
            height: fit.height,
            transform: `scale(${fit.scale})`,
          }}
        >
          {people.map((person) => {
            const position = board.personPositions.get(person.id) ?? { x: 16, y: 16 };
            return (
              <div
                className={styles.personName}
                key={person.id}
                style={{
                  left: position.x - fit.originX,
                  top: position.y - fit.originY,
                }}
              >
                <AlphabetName name={person.name} size={person.nameSize ?? 72} />
              </div>
            );
          })}
          {[...unsorted, ...people.flatMap((person) => person.entries)].map((entry) => {
            const position = board.entryPositions.get(entry.id) ?? { x: 16, y: 16 };
            return (
              <div
                className={`${styles.boardElement} ${entry.kind === "text" ? styles.boardText : ""}`.trim()}
                key={entry.id}
                style={{
                  left: position.x - fit.originX,
                  top: position.y - fit.originY,
                }}
              >
                {entry.kind === "text" ? (
                  <p
                    className={styles.entryText}
                    style={
                      entry.fontSize == null
                        ? undefined
                        : { fontSize: `${entry.fontSize}px` }
                    }
                  >
                    {entry.content}
                  </p>
                ) : (
                  <EntryImage entry={entry} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <span className={styles.visuallyHidden}>{label} — canvas preview</span>
    </div>
  );
}

function EntryImage({ entry }: { entry: CanvasEntry }) {
  if (!entry.imageUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={styles.image}
      src={entry.imageUrl}
      style={entry.imageSize === null ? undefined : { height: `${entry.imageSize}px` }}
    />
  );
}
