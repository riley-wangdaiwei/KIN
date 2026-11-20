"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { CanvasPerson } from "@/features/canvas/types";
import type { ProfileDirectoryEntry } from "@/features/profile/profile";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import styles from "./profile-content.module.css";

// The canvas directory, user-managed: the whole board first, then only
// the canvases the user names with the "+" below the list. People on the
// board are NEVER auto-added — the user adds canvases herself.
// Layout (her sketches): the list sits in the middle of the left half
// of the page; the preview sits in the exact center of the right half.
// The preview is hover-only — it appears while a name (or the preview
// itself) is hovered or focused, and is hidden otherwise. Hovering a
// name switches the preview; clicking it opens the canvas board at
// /canvas. Kept as its own component so it can be exercised with test
// data without a Supabase session.
export default function ProfileDirectory({
  directory,
  people,
  onAddCanvas,
}: {
  directory: ProfileDirectoryEntry[];
  // The board's people, offered as "+" suggestions (a canvas named after
  // a person links to them, so its preview shows their slice).
  people: CanvasPerson[];
  // Adds a canvas by name; resolves when it is saved, throws on failure.
  onAddCanvas: (name: string) => Promise<void>;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [addError, setAddError] = useState("");

  const activeEntry =
    (hoveredId
      ? directory.find((entry) => entry.id === hoveredId) ?? null
      : null) ?? null;

  const usedNames = new Set(
    directory.map((entry) => entry.label.toLowerCase()),
  );
  const suggestions = people.filter(
    (person) => !usedNames.has(person.name.toLowerCase()),
  );

  async function submitName(name: string) {
    const trimmed = name.trim();
    if (trimmed === "") return;
    try {
      await onAddCanvas(trimmed);
      setNameInput("");
      setEditorOpen(false);
      setAddError("");
    } catch (addFailure) {
      setAddError(
        addFailure instanceof Error
          ? addFailure.message
          : "That canvas could not be added.",
      );
    }
  }

  function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitName(nameInput);
  }

  if (directory.length === 0) {
    return (
      <p className={styles.status}>
        No canvases yet — <Link href="/canvas">start one on your canvas</Link>.
      </p>
    );
  }

  return (
    <div
      className={styles.directoryGrid}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHoveredId(null);
        }
      }}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div className={styles.directoryHalf}>
        <ul className={styles.directory}>
          {directory.map((entry) => (
            <li key={entry.id}>
              <Link
                aria-current={hoveredId === entry.id}
                className={styles.directoryItem}
                href="/canvas"
                onFocus={() => setHoveredId(entry.id)}
                onMouseEnter={() => setHoveredId(entry.id)}
              >
                {entry.label}
                <span className={styles.directoryCount}>
                  {entry.entryCount} {entry.entryCount === 1 ? "note" : "notes"}
                  {entry.gift ? " · gift" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          aria-expanded={editorOpen}
          aria-label="Add a canvas"
          className={styles.directoryAdd}
          onClick={() => setEditorOpen((open) => !open)}
          type="button"
        >
          +
        </button>
        {editorOpen && (
          <form className={styles.canvasEditor} onSubmit={handleAddSubmit}>
            <input
              aria-label="Name the canvas"
              autoFocus
              maxLength={120}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Name the canvas…"
              value={nameInput}
            />
            <button disabled={nameInput.trim() === ""} type="submit">
              Add
            </button>
            {suggestions.length > 0 && (
              <p className={styles.suggestions}>
                {suggestions.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => void submitName(person.name)}
                    type="button"
                  >
                    {person.name}
                  </button>
                ))}
              </p>
            )}
            {addError && (
              <p className={styles.error} role="alert">
                {addError}
              </p>
            )}
          </form>
        )}
      </div>
      <div className={styles.previewHalf}>
        {activeEntry && (
          <div className={styles.previewColumn}>
            <CanvasPreview
              label={activeEntry.label}
              people={activeEntry.people}
              unsorted={activeEntry.unsorted}
            />
            {activeEntry.gift && (
              <Link className={styles.gift} href={activeEntry.gift.href}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={activeEntry.gift.title}
                  className={styles.giftImage}
                  src={activeEntry.gift.image}
                />
                <span className={styles.giftCaption}>
                  {activeEntry.gift.title} — made with {activeEntry.gift.artist}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
