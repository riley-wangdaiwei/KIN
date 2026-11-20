"use client";

import { useRef, useState } from "react";
import ringStyles from "../site/hover-ring-menu.module.css";
import SiteArrow from "../site/SiteArrow";
import styles from "./profile-content.module.css";

// The artists the user worked with, top-right of the profile — a hover
// control modeled on the homepage HoverRingMenu (the side-nav ring button
// that expands on hover): hovering "artists" opens a drifting ring of
// the artist names. The trigger navigates nowhere; the ring is a list,
// not links (artist pages do not exist yet).
export default function ProfileArtists({
  artists,
}: {
  artists: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }

  if (artists.length === 0) return null;

  // The ring drifts by translating the track -50%, so the track is two
  // identical halves; each half repeats the names enough to fill the ring.
  const half: string[] = [...artists];
  while (half.length < 4) half.push(...artists);
  const ringItems = [...half, ...half];

  return (
    <div className={styles.artistsBlock}>
      <p className={styles.artistsCaption}>worked with</p>
      <div
        className={`${ringStyles.root} ${open ? ringStyles.open : ""}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            cancelClose();
            setOpen(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            cancelClose();
            setOpen(false);
          }
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            cancelClose();
            setOpen(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") scheduleClose();
        }}
      >
        <button
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Artists you worked with"
          className={ringStyles.trigger}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          onFocus={() => {
            cancelClose();
            setOpen(true);
          }}
          type="button"
        >
          artists
          <span aria-hidden="true" className={ringStyles.arrow}>
            <SiteArrow />
          </span>
        </button>
        <div
          aria-label="Artists you worked with"
          className={`${ringStyles.ring} ${ringStyles.left}`}
          role="group"
        >
          <div className={ringStyles.track}>
            {ringItems.map((artist, index) => (
              <span
                className={ringStyles.name}
                key={`${artist}-${index}`}
                style={{ "--item-index": index % half.length } as React.CSSProperties}
              >
                {artist}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
