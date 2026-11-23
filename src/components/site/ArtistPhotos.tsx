"use client";

import Image from "next/image";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-photos.module.css";

// Right half of /artists: the active artist's photos — one large on top,
// two small below, all aligned to the same outer edges — and the caption
// line underneath: Name · Region · one-liner. Artists without photos get
// the same layout as neutral outlined boxes ("Photos coming soon."), so
// the panel never shows a broken image and never jumps around.
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
              sizes="(max-width: 56rem) 100vw, 34rem"
            />
          </div>
          <div className={styles.smallRow}>
            <div className={styles.small}>
              <Image
                src={entry.photos.small[0]}
                alt={`${entry.name} — photo`}
                fill
                sizes="(max-width: 56rem) 50vw, 17rem"
              />
            </div>
            <div className={styles.small}>
              <Image
                src={entry.photos.small[1]}
                alt={`${entry.name} — photo`}
                fill
                sizes="(max-width: 56rem) 50vw, 17rem"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.placeholderLarge}>
            <p>Photos coming soon.</p>
          </div>
          <div className={styles.smallRow}>
            <div className={styles.placeholderSmall} />
            <div className={styles.placeholderSmall} />
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
