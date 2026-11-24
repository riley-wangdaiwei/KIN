"use client";

import Image from "next/image";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-photos.module.css";

// Right half of /artists: the active artist's photos — one large on top,
// two small below, all aligned to the same outer edges — and the caption
// line underneath: Name · Region · one-liner. The photo grid is always
// rendered, even for artists without photos: the empty slots (aria-hidden,
// nothing visible in them) keep the panel exactly as tall as the 3-photo
// layout, so the vertically-centered stage never jumps when the wheel
// rolls to a caption-only artist. Artists without photos show only their
// caption — no photo content, no placeholder.
export default function ArtistPhotos({ entry }: { entry: ArtistEntry }) {
  const captionParts = [entry.region, entry.line].filter(Boolean);
  return (
    <div className={styles.panel} data-testid="artist-photos">
      {entry.photos ? (
        <>
          <div className={styles.large}>
            <Image
              src={entry.photos.large}
              alt={`${entry.name} — photo`}
              fill
              sizes="(max-width: 56rem) 100vw, 40rem"
            />
          </div>
          <div className={styles.smallRow}>
            <div className={styles.small}>
              <Image
                src={entry.photos.small[0]}
                alt={`${entry.name} — photo`}
                fill
                sizes="(max-width: 56rem) 50vw, 20rem"
              />
            </div>
            <div className={styles.small}>
              <Image
                src={entry.photos.small[1]}
                alt={`${entry.name} — photo`}
                fill
                sizes="(max-width: 56rem) 50vw, 20rem"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.large} aria-hidden="true" />
          <div className={styles.smallRow} aria-hidden="true">
            <div className={styles.small} />
            <div className={styles.small} />
          </div>
        </>
      )}
      <p className={styles.caption}>
        <span className={styles.captionName}>{entry.name}</span>
        {captionParts.length > 0 ? ` · ${captionParts.join(" · ")}` : ""}
      </p>
    </div>
  );
}
