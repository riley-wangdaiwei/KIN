"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import styles from "./community-waterfall.module.css";

export type CommunityWaterfallEntry = {
  key: string;
  label: string;
  href: string;
};

type StreamItem = {
  id: number;
  entryIndex: number;
  // Half-relative coordinates; the half is the containing block for the
  // fixed-position items (see page.module.css), so these scroll with it.
  x: number;
  y: number;
  // Viewport coordinates, like the canvas engine: fall freely again once
  // the item's next position is past detourUntil, at column detourX.
  detourUntil?: number;
  detourX?: number;
};

// Same fall speed and fallback row height as the canvas waterfall, so the
// two streams feel like one system. Items are spaced wider here because a
// canvas name or a community question can wrap to two lines.
const SPACING = 56;
const SPEED = 1.25;
const ROW_HEIGHT = 28;

type Props = {
  entries: CommunityWaterfallEntry[];
  halfRef: RefObject<HTMLElement | null>;
  zoneRef: RefObject<HTMLElement | null>;
  // Which way items slide when they land on something. The left waterfall
  // slides left, the right one slides right, so both deflect outward,
  // away from the notes beside the kettles.
  detourSide: "left" | "right";
};

export default function CommunityWaterfall({ entries, halfRef, zoneRef, detourSide }: Props) {
  const [items, setItems] = useState<StreamItem[]>([]);
  const itemsRef = useRef<StreamItem[]>([]);
  const nextId = useRef(1);
  const nextEntryIndex = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (entries.length === 0 || itemsRef.current.length > 0) return;
    if (typeof window === "undefined") return;
    const half = halfRef.current;
    const zone = zoneRef.current;
    if (!half || !zone) return;
    const halfWidth = half.getBoundingClientRect().width;
    const zoneHeight = zone.getBoundingClientRect().height || window.innerHeight;
    const count = Math.ceil(zoneHeight / SPACING) + 1;
    // Like the canvas stream, restart at a random point in the cycle.
    const startIndex = Math.floor(Math.random() * entries.length);
    const verticalOffset = Math.random() * SPACING;
    const initial: StreamItem[] = Array.from({ length: count }).map((_, index) => ({
      id: nextId.current++,
      entryIndex: (startIndex + index) % entries.length,
      x: halfWidth / 2,
      y: index * SPACING - SPACING + verticalOffset,
    }));
    nextEntryIndex.current = startIndex + count;
    itemsRef.current = initial;
    setItems(initial);
  }, [entries, halfRef, zoneRef]);

  useEffect(() => {
    const update = (event: PointerEvent) => {
      const half = halfRef.current;
      if (!half) return;
      const rect = half.getBoundingClientRect();
      // Hovering near the fall line pauses the stream, like the canvas.
      pausedRef.current = Math.abs(event.clientX - (rect.left + rect.width / 2)) < 120;
    };
    const clear = () => {
      pausedRef.current = false;
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("pointerleave", clear);
    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerleave", clear);
    };
  }, [halfRef]);

  useEffect(() => {
    if (entries.length === 0 || reducedMotion) return;

    let frame = 0;
    const tick = () => {
      if (pausedRef.current) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const half = halfRef.current;
      const zone = zoneRef.current;
      if (!half || !zone) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const halfRect = half.getBoundingClientRect();
      const zoneBottom = zone.getBoundingClientRect().bottom;
      const columnViewportX = halfRect.left + halfRect.width / 2;
      // Items recycle at the viewport bottom, or at the bottom of the
      // stream zone when that comes first (on phones the note sits below
      // the zone, out of the fall path).
      const recycleAt = Math.min(window.innerHeight, zoneBottom);
      // The kettles (and the notes) are obstacles, exactly as on the
      // canvas: anything with [data-canvas-obstacle] is gone around.
      const hitAreas = [...document.querySelectorAll<HTMLElement>("[data-canvas-obstacle]")].map(
        (element) => element.getBoundingClientRect(),
      );
      const current = itemsRef.current;
      const next = current.map((item) => {
        const element = document.querySelector<HTMLElement>(`[data-stream-id="${item.id}"]`);
        const rect = element?.getBoundingClientRect();
        const width = rect?.width ?? 90;
        const height = rect?.height ?? ROW_HEIGHT;
        const viewportX = halfRect.left + item.x;
        const viewportY = halfRect.top + item.y;
        const nextViewportY = viewportY + SPEED;
        const hits = hitAreas.filter(
          (area) =>
            viewportX + width / 2 > area.left &&
            viewportX - width / 2 < area.right &&
            nextViewportY + height / 2 > area.top &&
            nextViewportY - height / 2 < area.bottom,
        );
        let detourUntil = item.detourUntil;
        let detourX = item.detourX;
        if (hits.length > 0) {
          const bottom = Math.max(...hits.map((area) => area.bottom));
          detourUntil = Math.max(detourUntil ?? -Infinity, bottom + height / 2 + 4);
          if (detourSide === "left") {
            const left = Math.min(...hits.map((area) => area.left));
            const candidate = Math.max(halfRect.left, left - width / 2 - 8);
            detourX = detourX === undefined ? candidate : Math.min(detourX, candidate);
          } else {
            const right = Math.max(...hits.map((area) => area.right));
            const candidate = Math.min(halfRect.right, right + width / 2 + 8);
            detourX = detourX === undefined ? candidate : Math.max(detourX, candidate);
          }
        }
        if (detourUntil !== undefined && nextViewportY > detourUntil) {
          detourUntil = undefined;
          detourX = undefined;
        }
        const targetViewportX = detourX ?? columnViewportX;
        const nextX = item.x + Math.max(-20, Math.min(20, targetViewportX - halfRect.left - item.x));
        const nextY = item.y + SPEED;
        if (nextViewportY > recycleAt + height) {
          const entryIndex = nextEntryIndex.current % entries.length;
          nextEntryIndex.current += 1;
          const minViewportY = Math.min(...current.map((candidate) => halfRect.top + candidate.y));
          return {
            id: nextId.current++,
            entryIndex,
            x: halfRect.width / 2,
            y: minViewportY - SPACING - halfRect.top,
            detourUntil: undefined,
            detourX: undefined,
          };
        }
        return { ...item, x: nextX, y: nextY, detourUntil, detourX };
      });

      itemsRef.current = next;
      setItems(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [entries, halfRef, zoneRef, reducedMotion, detourSide]);

  return (
    <div aria-hidden="true" className={styles.stream}>
      {items.map((item) => {
        const entry = entries[item.entryIndex];
        if (!entry) return null;
        return (
          <Link
            className={styles.fallingItem}
            data-stream-id={item.id}
            href={entry.href}
            key={item.id}
            style={{ left: item.x, top: item.y }}
            tabIndex={-1}
          >
            {entry.label}
          </Link>
        );
      })}
    </div>
  );
}
