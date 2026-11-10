"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "./hover-ring-menu.module.css";

export default function HoverRingMenu({
  href,
  items,
  label,
  menuSide = "right",
}: {
  href: string;
  items: readonly string[];
  label: string;
  menuSide?: "left" | "right";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function navigateOnClick() {
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch && !open) {
      setOpen(true);
      return;
    }
    router.push(href);
  }

  return (
    <div
      className={`${styles.root} ${open ? styles.open : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") setOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className={styles.trigger}
        onClick={navigateOnClick}
        onFocus={() => setOpen(true)}
        type="button"
      >
        {label}
        <span aria-hidden="true" className={styles.arrow}>→</span>
      </button>
      <div
        aria-label={`${label} examples`}
        className={`${styles.ring} ${menuSide === "left" ? styles.left : ""}`}
        role="group"
      >
        <div className={styles.track}>
          {[...items, ...items].map((item, index) => (
            <button
              className={styles.name}
              key={`${item}-${index}`}
              onClick={() => setOpen(true)}
              style={{ "--item-index": index % items.length } as React.CSSProperties}
              tabIndex={open ? 0 : -1}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
