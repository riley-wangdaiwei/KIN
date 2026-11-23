"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArtistJar from "./ArtistJar";
import type { ArtistEntry } from "@/features/artists/artists";
import styles from "./artist-wheel.module.css";

// A ring of artist/partner names circling a small jar, on the left half of
// the /artists page. The ring turns slowly and forever; the jar turns with
// it (its frames are driven by the same angle). Whichever name sits at the
// rightmost point of the circle lights up bright white and becomes the
// active artist; the rest stay dim. Hovering or focusing a word pauses the
// ring; clicking a word turns the ring so that word comes to the rightmost
// point. Reduced motion: a static ring, first name active.
const DEGREES_PER_FRAME = 0.12; // ~7.2°/s — one revolution in ~50s
const TWEEN_MS = 500;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
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
  const [stageWidth, setStageWidth] = useState(0);
  const [angle, setAngle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(isReducedMotion);
  const angleRef = useRef(0);
  const pausedRef = useRef(false);
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(
    null,
  );

  const slot = items.length > 0 ? 360 / items.length : 360;
  // The word at angle 0 sits at the rightmost point of the circle.
  const activeIndex =
    items.length === 0
      ? -1
      : (((Math.round(-norm360(angle) / slot) % items.length) +
          items.length) %
        items.length);

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
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setStageWidth(stage.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const tween = tweenRef.current;
      if (tween) {
        const t = Math.min(1, (now - tween.start) / TWEEN_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = tween.from + (tween.to - tween.from) * eased;
        angleRef.current = next;
        setAngle(next);
        if (t >= 1) tweenRef.current = null;
      } else if (!pausedRef.current) {
        const next = angleRef.current + (DEGREES_PER_FRAME * dt) / (1000 / 60);
        angleRef.current = next;
        setAngle(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Turn the ring so the clicked word comes to the rightmost point.
  const bringToFront = useCallback(
    (index: number) => {
      if (reduced) return;
      const current = norm360(angleRef.current + index * slot);
      const delta = current <= 180 ? -current : 360 - current;
      if (Math.abs(delta) < 0.5) return;
      tweenRef.current = {
        from: angleRef.current,
        to: angleRef.current + delta,
        start: performance.now(),
      };
    },
    [reduced, slot],
  );

  // The jar is small: about a third of the stage. The ring clears it with
  // room to breathe, and stays inside the stage.
  const jarSize = stageWidth * 0.34;
  const radius = Math.max(
    jarSize / 2 + 28,
    Math.min(stageWidth / 2 - 34, jarSize / 2 + 56),
  );
  const cx = stageWidth / 2;
  const cy = stageWidth / 2;

  return (
    <div ref={stageRef} className={styles.stage} data-testid="artist-wheel">
      <ArtistJar
        angle={angle}
        reducedMotion={reduced}
        className={styles.jar}
        style={{ width: jarSize, height: jarSize }}
      />
      {items.map((item, index) => {
        const theta = ((angle + index * slot) * Math.PI) / 180;
        const x = cx + radius * Math.cos(theta);
        const y = cy + radius * Math.sin(theta);
        const isActive = index === activeIndex;
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.word} ${isActive ? styles.wordActive : ""}`}
            style={{
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
            }}
            onClick={() => bringToFront(index)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            aria-pressed={isActive}
            data-testid={`wheel-word-${item.id}`}
            data-active={isActive}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
