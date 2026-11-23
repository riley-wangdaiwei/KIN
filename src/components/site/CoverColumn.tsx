"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./cover-column.module.css";

// The cover-style wheel: names in a vertical column beside the kettle,
// rolling vertically like a slot machine. The name at the vertical
// center of the column lights bright white; the names above and below
// it dim toward the edges. The column rolls slowly on its own; hovering
// it lets the user roll it by hand (mouse wheel, or drag with the
// mouse). Hovering a name pauses the roll and reports it to the parent
// (which shows its preview on the big screen); the parent also learns
// the center name whenever it changes, and learns when the pointer
// enters the column (so the big screen follows that column). Reduced
// motion: a static column, first name centered; manual rolling still
// works.
export type CoverColumnItem = {
  label: string;
  href: string;
};

type CoverColumnProps = {
  items: CoverColumnItem[];
  onCenterItem?: (item: CoverColumnItem | null) => void;
  onHoverItem?: (item: CoverColumnItem | null) => void;
  onEngage?: () => void;
};

// One name's slot (px): the name's line-height, so the text sits
// centered in its slot and neighbors sit a breath apart.
const SLOT_HEIGHT_PX = 38;
// The roll speed (px per ms): a name passes the center about every
// five seconds — slow enough to read, fast enough to feel alive.
const SPEED_PX_PER_MS = 0.008;
// Opacity at the column's top/bottom edges (1 at the center).
const OPACITY_EDGE = 0.45;
// A pointer move shorter than this is a click, not a drag.
const DRAG_THRESHOLD_PX = 4;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CoverColumn({
  items,
  onCenterItem,
  onHoverItem,
  onEngage,
}: CoverColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const hoverColumnRef = useRef(false);
  const hoverNameRef = useRef(false);
  const dragRef = useRef<{ startY: number; startOffset: number } | null>(
    null,
  );
  const suppressClickRef = useRef(false);
  const centerKeyRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const reducedMotion = isReducedMotion();

  const cycle = items.length * SLOT_HEIGHT_PX;

  // Measure the column's height so it knows how many names to render.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setHeight(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start at a random point in the loop (set after mount, so the server
  // and the first client render agree).
  useEffect(() => {
    if (startedRef.current || cycle === 0 || reducedMotion) return;
    startedRef.current = true;
    const start = Math.random() * cycle;
    offsetRef.current = start;
    setOffset(start);
  }, [cycle, reducedMotion]);

  // Reduced motion: keep the first name centered (recomputed when the
  // height is measured). The state sync is deferred to the next frame —
  // the ref already holds the value, and a synchronous setState in the
  // effect body is a cascading render.
  useEffect(() => {
    if (!reducedMotion || cycle === 0 || height === 0) return;
    const start = SLOT_HEIGHT_PX / 2 - height / 2;
    offsetRef.current = start;
    const frame = requestAnimationFrame(() => setOffset(start));
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, cycle, height]);

  // The roll: time-based, so the speed holds on any frame rate. The
  // offset is unbounded (it never wraps) — the rendered names are a
  // window into the repeating list, so the motion stays continuous and
  // no name ever remounts at a loop seam.
  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (t: number) => {
      if (last === null) last = t;
      const dt = t - last;
      last = t;
      if (!pausedRef.current) {
        offsetRef.current += dt * SPEED_PX_PER_MS;
        setOffset(offsetRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  // Rolling by hand: the mouse wheel over the column rolls it (the page
  // does not scroll while the pointer is over the column). A
  // non-passive listener, or the browser would scroll instead.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      offsetRef.current += event.deltaY;
      setOffset(offsetRef.current);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // The rendered names: a window into the repeating list, one extra slot
  // above and below the viewport so names roll in cleanly. Each slot's
  // key is its absolute index in the infinite list, so a name keeps its
  // element as it scrolls.
  const slots = useMemo(() => {
    if (items.length === 0 || height === 0) return [];
    const count =
      Math.ceil((height + SLOT_HEIGHT_PX * 2) / SLOT_HEIGHT_PX) + 1;
    const startK = Math.floor((offset - SLOT_HEIGHT_PX) / SLOT_HEIGHT_PX);
    const centerY = height / 2;
    const list = Array.from({ length: count }, (_, j) => {
      const k = startK + j;
      const y = k * SLOT_HEIGHT_PX - offset;
      const item = items[((k % items.length) + items.length) % items.length];
      const center = y + SLOT_HEIGHT_PX / 2;
      const dist = Math.abs(center - centerY);
      const opacity =
        1 - (1 - OPACITY_EDGE) * Math.min(1, dist / (height / 2));
      return { k, y, item, dist, opacity };
    });
    let best = list[0];
    for (const slot of list) {
      if (slot.dist < best.dist) best = slot;
    }
    return list.map((slot) => ({ ...slot, isActive: slot === best }));
  }, [items, height, offset]);

  // The center name: reported to the parent when it changes.
  const centerItem = useMemo(
    () => slots.find((slot) => slot.isActive)?.item ?? null,
    [slots],
  );

  useEffect(() => {
    const key = centerItem ? `${centerItem.href}|${centerItem.label}` : null;
    if (centerKeyRef.current !== key) {
      centerKeyRef.current = key;
      onCenterItem?.(centerItem);
    }
  }, [centerItem, onCenterItem]);

  const updatePaused = () => {
    pausedRef.current =
      hoverColumnRef.current ||
      hoverNameRef.current ||
      dragRef.current !== null;
  };

  if (slots.length === 0) {
    return <div className={styles.column} ref={containerRef} />;
  }

  return (
    <div
      className={styles.column}
      data-testid="cover-column"
      onPointerDown={(event) => {
        // Dragging is a mouse feature: touch drags scroll the page.
        if (event.pointerType === "touch") return;
        dragRef.current = {
          startY: event.clientY,
          startOffset: offsetRef.current,
        };
        pausedRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerEnter={() => {
        hoverColumnRef.current = true;
        pausedRef.current = true;
        onEngage?.();
      }}
      onPointerLeave={() => {
        hoverColumnRef.current = false;
        updatePaused();
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dy = event.clientY - drag.startY;
        if (Math.abs(dy) > DRAG_THRESHOLD_PX) suppressClickRef.current = true;
        // Dragging down pulls the list down (the offset falls).
        offsetRef.current = drag.startOffset - dy;
        setOffset(offsetRef.current);
      }}
      onPointerUp={() => {
        dragRef.current = null;
        updatePaused();
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }}
      ref={containerRef}
    >
      {slots.map((slot) => {
        const style: CSSProperties = {
          top: slot.y,
          opacity: slot.isActive ? 1 : slot.opacity,
        };
        return (
          <a
            aria-label={slot.item.label}
            className={`${styles.columnName} ${slot.isActive ? styles.columnNameActive : ""}`.trim()}
            data-active={slot.isActive || undefined}
            data-slot={slot.k}
            href={slot.item.href}
            key={slot.k}
            onBlur={() => {
              hoverNameRef.current = false;
              updatePaused();
              onHoverItem?.(null);
            }}
            onClick={(event) => {
              if (suppressClickRef.current) event.preventDefault();
            }}
            onFocus={() => {
              hoverNameRef.current = true;
              pausedRef.current = true;
              onHoverItem?.(slot.item);
            }}
            onMouseEnter={() => {
              hoverNameRef.current = true;
              pausedRef.current = true;
              onHoverItem?.(slot.item);
            }}
            onMouseLeave={() => {
              hoverNameRef.current = false;
              updatePaused();
              onHoverItem?.(null);
            }}
            style={style}
            tabIndex={-1}
          >
            {slot.item.label}
          </a>
        );
      })}
    </div>
  );
}
