"use client";

import { useEffect, useState } from "react";
import type { CanvasEntry, SharedCanvas } from "@/features/canvas/types";
import { resolveBoardPositions } from "@/features/canvas/positions";
import styles from "./shared-canvas-view.module.css";

export default function SharedCanvasView({ token }: { token: string }) {
  const [canvas, setCanvas] = useState<SharedCanvas | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`/api/canvas/share/${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = (await response.json()) as SharedCanvas | { error?: string };
        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "This shared canvas could not be opened.",
          );
        }
        if (active) setCanvas(result as SharedCanvas);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This shared canvas could not be opened.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (error) return <p className={styles.status} role="alert">{error}</p>;
  if (!canvas) return <p className={styles.status}>Loading shared canvas…</p>;

  const board = resolveBoardPositions(canvas.people, canvas.unsorted);

  return (
    <div className={styles.canvas} style={{ minHeight: board.contentHeight }}>
      {canvas.people.map((person) => {
        const position = board.personPositions.get(person.id) ?? { x: 16, y: 16 };
        return (
          <h2 className={styles.personName} key={person.id} style={{ left: position.x, top: position.y }}>
            {person.name}
          </h2>
        );
      })}
      {[...canvas.unsorted, ...canvas.people.flatMap((person) => person.entries)].map((entry) => {
        const position = board.entryPositions.get(entry.id) ?? { x: 16, y: 16 };
        return (
          <div
            className={`${styles.boardElement} ${entry.kind === "text" ? styles.boardText : ""}`.trim()}
            key={entry.id}
            style={{ left: position.x, top: position.y }}
          >
            {entry.kind === "text" ? <p className={styles.entryText}>{entry.content}</p> : <EntryImage entry={entry} />}
          </div>
        );
      })}
    </div>
  );
}

function EntryImage({ entry }: { entry: CanvasEntry }) {
  if (!entry.imageUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={entry.kind === "sticker" ? "re.KIN pot sticker" : "Canvas image"}
      className={styles.image}
      src={entry.imageUrl}
      style={entry.imageSize === null ? undefined : { height: `${entry.imageSize}px` }}
    />
  );
}
