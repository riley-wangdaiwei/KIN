"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./kettle-note.module.css";

// The note that used to sit beside each kettle, now behind a small white
// "?" next to the kettle (inner side, where the note sat). Hovering or
// focusing the "?" opens the note as a normal horizontal paragraph —
// around 19rem wide, normal line length, never the old 7rem narrow
// column. The card stays open while the pointer is over the "?" or the
// card, so the links inside can be clicked; it closes on leave, on blur,
// on Escape, and on a tap outside it. The card is fixed, so it escapes
// the half's overflow and sits beside the "?" wherever the kettle is.
export default function KettleNote({
  kettle,
  side,
  label,
  children,
}: {
  kettle: "jar" | "pitcher";
  side: "left" | "right";
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  // The card's width is 19rem in CSS — measure it in rem off the root
  // font size, so the placement math matches the rendered card.
  const cardWidth = useCallback(() => {
    if (cardRef.current) {
      return cardRef.current.getBoundingClientRect().width;
    }
    const rem = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return Math.min(19 * (Number.isFinite(rem) ? rem : 16), window.innerWidth * 0.86);
  }, []);

  const placeCard = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = cardWidth();
    let left =
      side === "left" ? rect.right + 12 : rect.left - 12 - width;
    left = Math.max(12, Math.min(left, window.innerWidth - 12 - width));
    const cardHeight = cardRef.current?.getBoundingClientRect().height ?? 160;
    const top = Math.max(
      12,
      Math.min(rect.top, window.innerHeight - 12 - cardHeight),
    );
    setPosition({ top, left });
  }, [side, cardWidth]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, [cancelClose]);

  const openCard = useCallback(() => {
    cancelClose();
    // Place it beside the "?" right away (from the button rect, before
    // the card itself is measured) so it never flashes at the corner.
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const width = cardWidth();
      let left =
        side === "left" ? rect.right + 12 : rect.left - 12 - width;
      left = Math.max(12, Math.min(left, window.innerWidth - 12 - width));
      setPosition({ top: rect.top, left });
    }
    setOpen(true);
  }, [cancelClose, side, cardWidth]);

  // Re-place once the card exists (its real height), and while it is open.
  useLayoutEffect(() => {
    if (open) placeCard();
  }, [open, placeCard]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", placeCard);
    window.addEventListener("scroll", placeCard, true);
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node | null)) {
        cancelClose();
        setOpen(false);
      }
    };
    // Escape closes the card even when focus never entered it (the card
    // is usually opened by hovering the "?", not by focusing it).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelClose();
        setOpen(false);
        buttonRef.current?.blur();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", placeCard);
      window.removeEventListener("scroll", placeCard, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, placeCard, cancelClose]);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div
      className={styles.noteWrap}
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
          buttonRef.current?.blur();
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") openCard();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") scheduleClose();
      }}
      ref={wrapRef}
    >
      <button
        aria-expanded={open}
        aria-label={label}
        className={`${styles.noteTrigger} ${kettle === "jar" ? styles.noteTriggerJar : styles.noteTriggerPitcher}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onFocus={openCard}
        ref={buttonRef}
        type="button"
      >
        ?
      </button>
      {open && (
        <div
          className={`${styles.noteCard} ${side === "left" ? styles.noteCardLeft : styles.noteCardRight}`}
          data-testid="kettle-note-card"
          ref={cardRef}
          style={{ top: position.top, left: position.left }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
