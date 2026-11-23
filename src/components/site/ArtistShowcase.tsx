"use client";

import { useCallback, useState } from "react";
import ArtistWheel from "./ArtistWheel";
import ArtistPhotos from "./ArtistPhotos";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-showcase.module.css";

// The /artists split: the word wheel around the small jar on the left,
// the active artist's photos on the right. The wheel reports whichever
// name sits at the rightmost point; the photos follow it.
export default function ArtistShowcase({ items }: { items: ArtistEntry[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const active = items.find((item) => item.id === activeId) ?? items[0];

  const handleActiveChange = useCallback((entry: ArtistEntry) => {
    setActiveId(entry.id);
  }, []);

  if (!active) return null;

  return (
    <div className={styles.split}>
      <ArtistWheel items={items} onActiveChange={handleActiveChange} />
      <ArtistPhotos entry={active} />
    </div>
  );
}
