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
        className={styles.trigger}
        onClick={navigateOnClick}
        onFocus={() => {
          cancelClose();
          setOpen(true);
        }}
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
