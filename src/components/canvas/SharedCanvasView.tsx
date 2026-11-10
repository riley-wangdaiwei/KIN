"use client";

import { useEffect, useState } from "react";
import type { CanvasEntry, SharedCanvas } from "@/features/canvas/types";
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

  return (
    <div className={styles.canvas}>
      {canvas.person ? (
        <section className={styles.person}>
          <h2>{canvas.person.name}</h2>
          <SharedEntries entries={canvas.people[0]?.entries ?? []} />
        </section>
      ) : (
        <>
          <section className={styles.unsorted}>
            <h2>Unsorted</h2>
            <SharedEntries entries={canvas.unsorted} />
          </section>
          <div className={styles.columns}>
            {canvas.people.map((person) => (
              <section className={styles.person} key={person.id}>
                <h2>{person.name}</h2>
                <SharedEntries entries={person.entries} />
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SharedEntries({ entries }: { entries: CanvasEntry[] }) {
  const textEntries = entries.filter((entry) => entry.kind === "text");
  const rendered = new Set<string>();

  return (
    <div className={styles.entries}>
      {textEntries.map((entry) => {
        rendered.add(entry.id);
        const images = entries.filter((candidate) => candidate.relatedEntryId === entry.id);
        images.forEach((image) => rendered.add(image.id));
        return (
          <p className={styles.entryLine} key={entry.id}>
            <span>{entry.content}</span>
            {images.map((image) => (
              <EntryImage entry={image} key={image.id} />
            ))}
          </p>
        );
      })}
      {entries
        .filter((entry) => !rendered.has(entry.id))
        .map((entry) => (
          <p className={styles.entryLine} key={entry.id}>
            {entry.kind === "text" ? entry.content : <EntryImage entry={entry} />}
          </p>
        ))}
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
    />
  );
}
