"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ArtistJar from "./ArtistJar";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-wheel.module.css";

// A cover-style wheel: the artists' and partners' names in a vertical
// column beside the small jar — some bright white, some dim. The name
// at the column's center is the front-most one: bright white and
// largest; names above and below it fade and shrink with distance
// from the center, and disappear at the column's top and bottom edges.
// The list wraps, so it rolls forever.
//
// Rolling is manual on hover: scrolling the mouse wheel while hovering
// the wheel rolls the column by hand, and dragging it vertically spins
// it too — so trackpads and touch can roll it. When the pointer is
// not over the wheel it drifts on its own (one full pass through the
// list in ~50s). Hovering or focusing a word pauses the drift, as
// before. The jar turns as the list rolls (its frames are driven by
// the same position, one full jar turn per full pass through the list).
// Clicking a word tweens it to the center. Reduced motion: a static
// list (manual rolling still works — it is the user's own input, not
// auto-motion).
const ROWS_PER_MS = 1 / 50000; // one full pass through the list in ~50s
const TWEEN_MS = 500;
const ROW_HEIGHT_PX = 34;
// Mouse-wheel rolling: rows per pixel of scroll, clamped per event so
// a trackpad fling never throws the list around.
const WHEEL_ROWS_PER_PX = 0.008;
const WHEEL_MAX_ROWS = 2;
// A drag counts as a spin (not a click) once the pointer moves this far.
const DRAG_CLICK_THRESHOLD_PX = 6;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Wrapped offset from the center, in rows: 0 is the front-most row,
// negative is above, positive is below.
function wrapOffset(value: number, count: number): number {
  let wrapped = ((value % count) + count) % count;
  if (wrapped > count / 2) wrapped -= count;
  return wrapped;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type ArtistWheelProps = {
  items: ArtistEntry[];
  onActiveChange: (entry: ArtistEntry) => void;
};

export default function ArtistWheel({
  items,
  onActiveChange,
}: ArtistWheelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [columnHeight, setColumnHeight] = useState(224);
  // Position in rows (float). 0 puts the first item at the center, so
  // the page loads showing Rhema Tan's photos.
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const [reduced] = useState(isReducedMotion);
  const positionRef = useRef(0);
  const pausedRef = useRef(false);
  const manualRef = useRef(false);
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(
    null,
  );
  const dragRef = useRef<{
    lastY: number;
    moved: number;
    captured: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const count = items.length;
  // The item nearest the column's center is the active one.
  let activeIndex = 0;
  for (let i = 1; i < count; i++) {
    if (
      Math.abs(wrapOffset(i - position, count)) <
      Math.abs(wrapOffset(activeIndex - position, count))
    ) {
      activeIndex = i;
    }
  }
  if (count === 0) activeIndex = -1;

  const activeRef = useRef(activeIndex);
  useEffect(() => {
    if (activeIndex !== activeRef.current && activeIndex >= 0) {
      activeRef.current = activeIndex;
      onActiveChange(items[activeIndex]);
    }
  }, [activeIndex, items, onActiveChange]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    manualRef.current = manual;
  }, [manual]);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const measure = () => setColumnHeight(column.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  // Auto-drift (time-based, so the speed holds on any frame rate). It
  // runs only when the list is neither paused nor under manual
  // control; a click tween takes precedence over it.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last === null) last = now;
      const dt = now - last;
      last = now;
      const tween = tweenRef.current;
      if (tween) {
        const t = Math.min(1, (now - tween.start) / TWEEN_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = tween.from + (tween.to - tween.from) * eased;
        positionRef.current = next;
        setPosition(next);
        if (t >= 1) tweenRef.current = null;
      } else if (!pausedRef.current && !manualRef.current) {
        const next = positionRef.current + dt * ROWS_PER_MS * count;
        positionRef.current = next;
        setPosition(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, count]);

  const applyManualDelta = useCallback((deltaRows: number) => {
    tweenRef.current = null;
    const next = positionRef.current + deltaRows;
    positionRef.current = next;
    setPosition(next);
  }, []);

  // Manual rolling by mouse wheel: a non-passive listener, so scrolling
  // over the wheel rolls the column instead of the page.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      applyManualDelta(
        clamp(
          delta * WHEEL_ROWS_PER_PX,
          -WHEEL_MAX_ROWS,
          WHEEL_MAX_ROWS,
        ),
      );
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [applyManualDelta]);

  // Manual rolling by drag: the column follows the hand vertically.
  // Pointer capture engages only once the gesture is a real drag, so
  // a plain click still lands on the word button (capturing on
  // pointerdown would retarget the click to the stage instead).
  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A fresh press starts a new gesture: any suppression left over
    // from an earlier drag is stale.
    suppressClickRef.current = false;
    dragRef.current = { lastY: event.clientY, moved: 0, captured: false };
    tweenRef.current = null;
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = event.clientY - drag.lastY;
      drag.lastY = event.clientY;
      drag.moved += Math.abs(dy);
      if (!drag.captured && drag.moved > DRAG_CLICK_THRESHOLD_PX) {
        drag.captured = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      applyManualDelta(-dy / ROW_HEIGHT_PX);
    },
    [applyManualDelta],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && drag.moved > DRAG_CLICK_THRESHOLD_PX) {
      suppressClickRef.current = true;
    }
  }, []);

  // Bring the clicked word to the center of the column.
  const bringToFront = useCallback(
    (index: number) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      const delta = wrapOffset(index - positionRef.current, count);
      if (Math.abs(delta) < 0.05) return;
      if (reduced) {
        const next = positionRef.current + delta;
        positionRef.current = next;
        setPosition(next);
        return;
      }
      tweenRef.current = {
        from: positionRef.current,
        to: positionRef.current + delta,
        start: performance.now(),
      };
    },
    [count, reduced],
  );

  if (count === 0) return null;

  // The jar is small beside the column, and turns as the list rolls:
  // one full pass through the list is one full turn of the jar. The
  // 90° offset puts the side view (not the top-down frame) at the
  // resting position, so the jar reads as a jar when the page loads.
  const jarSize = Math.min(140, columnHeight * 0.62);
  const jarAngle = 90 + (position / count) * 360;
  const centerY = columnHeight / 2;
  const visibleRows = Math.floor(columnHeight / 2 / ROW_HEIGHT_PX) + 1;

  const rows = items.map((item, index) => {
    const offset = wrapOffset(index - position, count);
    const distance = Math.abs(offset);
    // Brightness and size fall off with distance from the center: the
    // front-most name is bright white and largest, the rest fade and
    // shrink toward the column's edges.
    const closeness = Math.max(0, 1 - distance / (visibleRows + 0.5));
    const opacity = 0.35 + 0.65 * closeness;
    const scale = 0.85 + 0.33 * closeness;
    const isActive = index === activeIndex;
    const y = centerY + offset * ROW_HEIGHT_PX;
    const style = {
      transform: `translateY(${y}px) translateY(-50%) scale(${scale})`,
      "--word-opacity": isActive ? 1 : opacity,
    } as CSSProperties;
    return (
      <button
        key={item.id}
        type="button"
        className={`${styles.word} ${isActive ? styles.wordActive : ""}`}
        style={style}
        onClick={() => bringToFront(index)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-pressed={isActive}
        data-testid={`wheel-word-${item.id}`}
        data-active={isActive}
        data-offset={offset.toFixed(2)}
      >
        {item.name}
      </button>
    );
  });

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-testid="artist-wheel"
      onPointerEnter={() => setManual(true)}
      onPointerLeave={() => {
        setManual(false);
        endDrag();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <ArtistJar
        angle={jarAngle}
        reducedMotion={reduced}
        className={styles.jar}
        style={{ width: jarSize, height: jarSize }}
      />
      <div ref={columnRef} className={styles.column}>
        {rows}
      </div>
    </div>
  );
}
