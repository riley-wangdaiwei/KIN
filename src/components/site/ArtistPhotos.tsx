"use client";

import Image from "next/image";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-photos.module.css";

// Right half of /artists: the active artist's photos — one large on top,
// two small below, all aligned to the same outer edges — and the caption
// line underneath: Name · Region · one-liner. Artists without photos
// show only their caption — no photo area at all, no placeholder.
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
      ) : null}
      <p className={styles.caption}>
        <span className={styles.captionName}>{entry.name}</span>
        {captionParts.length > 0 ? ` · ${captionParts.join(" · ")}` : ""}
      </p>
    </div>
  );
}
