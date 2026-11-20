"use client";

import Link from "next/link";
import type { ProfileDirectoryEntry } from "@/features/profile/profile";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import styles from "./profile-content.module.css";

// The canvas directory: a plain vertical list of canvas names on the left,
// and a wide rectangular page-preview thumbnail on the right (her sketches)
// — the hovered canvas rendered small, like a screenshot of its page.
// Kept as its own component so it can be exercised with test data without
// a Supabase session.
export default function ProfileDirectory({
  directory,
  activeId,
  onSelect,
}: {
  directory: ProfileDirectoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const activeEntry =
    directory.find((entry) => entry.id === activeId) ?? directory[0] ?? null;

  if (directory.length === 0) {
    return (
      <p className={styles.status}>
        No canvases yet — <Link href="/canvas">start one on your canvas</Link>.
      </p>
    );
  }

  return (
    <div className={styles.directoryRow}>
      <ul className={styles.directory}>
        {directory.map((entry) => (
          <li key={entry.id}>
            <button
              aria-current={activeEntry?.id === entry.id}
              className={
                activeEntry?.id === entry.id
                  ? `${styles.directoryItem} ${styles.directoryItemActive}`.trim()
                  : styles.directoryItem
              }
              onClick={() => onSelect(entry.id)}
              onFocus={() => onSelect(entry.id)}
              onMouseEnter={() => onSelect(entry.id)}
              type="button"
            >
              {entry.label}
              <span className={styles.directoryCount}>
                {entry.entryCount} {entry.entryCount === 1 ? "note" : "notes"}
                {entry.gift ? " · gift" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
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
  );
}
