"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import styles from "./waterfall.module.css";

// One item of a flowing waterfall: a word, a provided image, or a question
// word. The same engine runs on the canvas and on the community page.
export type WaterfallTemplate = {
  kind: "word" | "image" | "question";
  label?: string;
  imageSrc?: string;
  stickerKey?: string;
  questionId?: string;
  questionLabel?: string;
  // Link items (community): clicking opens the canvas instead of dragging.
  href?: string;
  // Fixed lateral fraction inside the fall (0 = left edge, 1 = right edge).
  // The weekly question's words share one fraction so they read as a block.
  frac?: number;
  // Long labels (community question titles) truncate to one row.
  truncate?: boolean;
};

// One draggable waterfall item, as the drop dispatch reads it.
export type WaterfallDropItem = {
  id: number;
  kind: "word" | "image" | "question";
  label?: string;
  stickerKey?: string;
  questionId?: string;
};

export type WaterfallDropTarget = {
  clientX: number;
  clientY: number;
  personId: string | null;
  relatedEntryId: string | null;
  isCanvasTarget: boolean;
};

export type WaterfallDragState = {
  dragging: boolean;
  personId: string | null;
  isCanvas: boolean;
};

type WaterfallProps = {
  templates: WaterfallTemplate[];
  // Re-seed when this changes (new weekly question, community data loaded).
  refreshKey?: string;
  // The element the column flows in (the right 38% of it). Defaults to the
  // viewport — the canvas. The community halves pass their section.
  regionRef?: RefObject<HTMLElement | null>;
  onDragState?: (state: WaterfallDragState) => void;
  onDropItem?: (item: WaterfallDropItem, target: WaterfallDropTarget) => void;
};

// A narrow column on the right edge, items scrolling steadily down and
// recycling at the top, full viewport height — they enter at the top edge
// and disappear at the bottom, passing behind the fixed header/footer.
const STREAM_ROW_HEIGHT = 28;
const STREAM_SPEED = 1.25;
// The fall is shaped like a waterfall: narrow at the top, wider toward the
// bottom. The stream region is the right 38% of the region element and the
// fall is centered at 72% of the region, so it hugs the right edge at the
// top and spreads leftward as items fall.
const REGION_SHARE = 0.38;
const SHAPE_CENTER = 0.72;
const SHAPE_TOP = 0.1;
const SHAPE_BOTTOM = 0.6;
const SHAPE_CURVE = 2.6;
// Items fade in over the top of the page and out at the bottom, so they
// dissolve into the fixed chrome instead of popping in and out.
const TOP_FADE_PX = 76;
const BOTTOM_FADE_PX = 56;

type WaterfallItem = WaterfallTemplate & {
  id: number;
  x: number;
  y: number;
  speed: number;
  // Lateral position inside the fall (0 = left edge, 1 = right edge), fixed
  // for the item's whole fall — as the fall widens, the item drifts outward.
  frac: number;
  // Opacity, computed by the engine with each position (edge fades + the
  // top/bottom dissolve) — render only reads it, never a ref.
  opacity: number;
  detourUntil?: number;
  detourX?: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function dropTargetFromPoint(clientX: number, clientY: number): {
  personId: string | null;
  relatedEntryId: string | null;
  isCanvasTarget: boolean;
} {
  const target = document.elementFromPoint(clientX, clientY);
  const personId = target?.closest<HTMLElement>("[data-person-id]")?.dataset.personId ?? null;
  const relatedEntryId =
    target?.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId ?? null;
  const isCanvasTarget = Boolean(
    target?.closest<HTMLElement>("[data-person-id], [data-canvas-area]"),
  );
  return { personId, relatedEntryId, isCanvasTarget };
}

export default function Waterfall({
  templates,
  refreshKey = "",
  regionRef,
  onDragState,
  onDropItem,
}: WaterfallProps) {
  const templatesRef = useRef(templates);
  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);
  const [streamItems, setStreamItems] = useState<WaterfallItem[]>([]);
  const streamRef = useRef<WaterfallItem[]>([]);
  const draggingWordRef = useRef<WaterfallItem | null>(null);
  const [draggingStreamId, setDraggingStreamId] = useState<number | null>(null);
  const nextStreamId = useRef(1);
  const nextSequenceIndex = useRef(0);
  const pointerNearStream = useRef(false);
  const seededForRef = useRef<string | undefined>(undefined);
  const reducedMotion = isReducedMotion();
  // The region the column flows in (right 38% of it), in viewport coords.
  const region = useRef({ left: 0, width: 0 });

  const syncRegion = useCallback(() => {
    if (typeof window === "undefined") return;
    const element = regionRef?.current;
    // The column flows in the right 38% of the region element (or of the
    // viewport, when no element is given).
    if (element) {
      const rect = element.getBoundingClientRect();
      region.current = {
        left: rect.left + rect.width * (1 - REGION_SHARE),
        width: rect.width * REGION_SHARE,
      };
    } else {
      region.current = {
        left: window.innerWidth * (1 - REGION_SHARE),
        width: window.innerWidth * REGION_SHARE,
      };
    }
  }, [regionRef]);

  useEffect(() => {
    syncRegion();
    window.addEventListener("resize", syncRegion);
    return () => window.removeEventListener("resize", syncRegion);
  }, [syncRegion]);

  useEffect(() => {
    streamRef.current = streamItems;
  }, [streamItems]);

  // Left/right edge of the fall at viewport height y, in viewport coords.
  const streamBounds = useCallback((y: number): [number, number] => {
    const innerHeight = window.innerHeight;
    const { left: regionLeft, width: regionWidth } = region.current;
    const t = clamp01(y / Math.max(1, innerHeight));
    const share = SHAPE_TOP + (SHAPE_BOTTOM - SHAPE_TOP) * Math.pow(t, SHAPE_CURVE);
    const half = (share * regionWidth) / 2;
    const center = regionLeft + SHAPE_CENTER * regionWidth;
    return [center - half, center + half];
  }, []);

  const shapeX = useCallback(
    (y: number, frac: number): number => {
      const [left, right] = streamBounds(y);
      return left + frac * (right - left);
    },
    [streamBounds],
  );

  // Words near the fall's edges are fainter, like a waterfall's spray.
  // The fade bottoms out at 0.35: items steered outside the fall by a
  // detour stay visible (never negative — an unclamped edge goes below
  // zero and the word vanishes mid-detour).
  const fadeFor = useCallback(
    (x: number, y: number): number => {
      const [left, right] = streamBounds(y);
      const edge = Math.min(x - left, right - x) / Math.max(1, (right - left) / 2);
      return Math.max(0.35, 0.35 + 0.65 * Math.min(1, edge * 2.2));
    },
    [streamBounds],
  );

  // Items dissolve into the fixed chrome at the top and bottom edges.
  const verticalFade = useCallback((y: number): number => {
    const innerHeight = window.innerHeight;
    return Math.min(
      clamp01(y / TOP_FADE_PX),
      clamp01((innerHeight - y) / BOTTOM_FADE_PX),
    );
  }, []);

  // Opacity for an item at (x, y): images keep full lateral opacity, like
  // before; words fade near the fall's edges. Everything dissolves into
  // the chrome at the top and bottom.
  const itemOpacity = useCallback(
    (x: number, y: number, kind: WaterfallTemplate["kind"]): number => {
      const lateral = kind === "image" ? 1 : fadeFor(x, y);
      return lateral * verticalFade(y);
    },
    [fadeFor, verticalFade],
  );

  const seed = useCallback(() => {
    if (typeof window === "undefined") return;
    const sequence = templatesRef.current;
    if (sequence.length === 0) return;
    const count = Math.ceil(window.innerHeight / STREAM_ROW_HEIGHT) + 1;
    const startIndex = Math.floor(Math.random() * sequence.length);
    const verticalOffset = Math.random() * STREAM_ROW_HEIGHT;
    // The stream lays out top-to-bottom in reverse sequence order (new
    // items enter above the top), so templates are placed in reverse: the
    // item at index i is sequence[startIndex - i]. Blocks like the weekly
    // question therefore read top-to-bottom in sequence order from the
    // first frame, and stay that way as items recycle.
    const items = Array.from({ length: count }).map((_, index) => {
      const template = sequence[mod(startIndex - index, sequence.length)];
      const y = index * STREAM_ROW_HEIGHT - STREAM_ROW_HEIGHT + verticalOffset;
      const frac = template.frac ?? Math.random();
      const x = shapeX(y, frac);
      return {
        ...template,
        id: index + 1,
        x,
        y,
        speed: STREAM_SPEED,
        frac,
        opacity: itemOpacity(x, y, template.kind),
      };
    });
    nextStreamId.current = count + 1;
    nextSequenceIndex.current = startIndex + 1;
    streamRef.current = items;
    setStreamItems(items);
  }, [itemOpacity, shapeX]);

  // Seed once at mount, and again when the templates change (new weekly
  // question, community data loaded).
  useEffect(() => {
    if (streamRef.current.length === 0 || seededForRef.current !== refreshKey) {
      seededForRef.current = refreshKey;
      seed();
    }
  }, [refreshKey, seed]);

  useEffect(() => {
    const updatePointerProximity = (event: PointerEvent) => {
      const { left, width } = region.current;
      pointerNearStream.current =
        event.clientX >= left - 60 && event.clientX <= left + width + 60;
    };
    const clearPointerProximity = () => {
      pointerNearStream.current = false;
    };
    window.addEventListener("pointermove", updatePointerProximity);
    window.addEventListener("pointerleave", clearPointerProximity);
    return () => {
      window.removeEventListener("pointermove", updatePointerProximity);
      window.removeEventListener("pointerleave", clearPointerProximity);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    const tick = () => {
      if (draggingWordRef.current || pointerNearStream.current) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const sequence = templatesRef.current;
      const hitAreas = [
        ...document.querySelectorAll<HTMLElement>(
          `[data-board-element], [data-canvas-obstacle]`,
        ),
      ].map((element) => element.getBoundingClientRect());
      const items = streamRef.current.map((item) => {
        if (draggingWordRef.current?.id === item.id) return item;
        const nextY = item.y + item.speed;
        const element = document.querySelector<HTMLElement>(`[data-stream-id="${item.id}"]`);
        const rect = element?.getBoundingClientRect();
        const width = rect?.width ?? 90;
        const height = rect?.height ?? STREAM_ROW_HEIGHT;
        const hit = hitAreas.find(
          (area) =>
            item.x + width / 2 > area.left &&
            item.x - width / 2 < area.right &&
            nextY + height / 2 > area.top &&
            nextY - height / 2 < area.bottom,
        );
        let detourUntil = item.detourUntil;
        let detourX = item.detourX;
        if (hit && detourUntil === undefined) {
          detourUntil = hit.bottom + height / 2 + 4;
          detourX = Math.max(0, hit.left - width / 2 - 8);
        }
        if (detourUntil !== undefined && nextY > detourUntil) {
          detourUntil = undefined;
          detourX = undefined;
        }
        const targetX = detourX ?? shapeX(nextY, item.frac);
        const nextX = item.x + Math.max(-20, Math.min(20, targetX - item.x));
        if (nextY > window.innerHeight + height) {
          const template = sequence[nextSequenceIndex.current % sequence.length];
          nextSequenceIndex.current += 1;
          const y =
            Math.min(...streamRef.current.map((candidate) => candidate.y)) -
            STREAM_ROW_HEIGHT;
          const frac = template.frac ?? Math.random();
          const x = shapeX(y, frac);
          return {
            ...template,
            id: nextStreamId.current++,
            x,
            y,
            speed: STREAM_SPEED,
            frac,
            opacity: itemOpacity(x, y, template.kind),
          };
        }
        return { ...item, x: nextX, y: nextY, detourUntil, detourX, opacity: itemOpacity(nextX, nextY, item.kind) };
      });

      streamRef.current = items;
      setStreamItems(items);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [itemOpacity, reducedMotion, shapeX]);

  // Keep the column full when the viewport grows taller.
  useEffect(() => {
    const topUp = () => {
      const current = streamRef.current;
      if (current.length === 0) return;
      const needed = Math.ceil(window.innerHeight / STREAM_ROW_HEIGHT) + 1;
      if (current.length >= needed) return;
      const sequence = templatesRef.current;
      const minY = Math.min(...current.map((candidate) => candidate.y));
      const extra = Array.from({ length: needed - current.length }).map((_, index) => {
        const template = sequence[nextSequenceIndex.current % sequence.length];
        nextSequenceIndex.current += 1;
        const y = minY - STREAM_ROW_HEIGHT * (index + 1);
        const frac = template.frac ?? Math.random();
        const x = shapeX(y, frac);
        return {
          ...template,
          id: nextStreamId.current++,
          x,
          y,
          speed: STREAM_SPEED,
          frac,
          opacity: itemOpacity(x, y, template.kind),
        };
      });
      const items = [...extra, ...current];
      streamRef.current = items;
      setStreamItems(items);
    };
    window.addEventListener("resize", topUp);
    return () => window.removeEventListener("resize", topUp);
  }, [itemOpacity, shapeX]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const active = draggingWordRef.current;
      if (!active) return;
      const { personId, isCanvasTarget } = dropTargetFromPoint(event.clientX, event.clientY);
      onDragState?.({ dragging: true, personId, isCanvas: isCanvasTarget });
      setStreamItems((current) =>
        current.map((item) =>
          // The dragged word stays fully visible under the pointer, whatever
          // its stream fade was.
          item.id === active.id ? { ...item, x: event.clientX, y: event.clientY, opacity: 1 } : item,
        ),
      );
    },
    [onDragState],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      const active = draggingWordRef.current;
      if (!active) return;
      const { personId, relatedEntryId, isCanvasTarget } = dropTargetFromPoint(
        event.clientX,
        event.clientY,
      );
      draggingWordRef.current = null;
      setDraggingStreamId(null);
      setStreamItems((current) =>
        current.map((item) =>
          item.id === active.id
            ? {
                ...item,
                x: shapeX(active.y, item.frac),
                y: active.y,
                detourX: undefined,
                detourUntil: undefined,
                opacity: itemOpacity(shapeX(active.y, item.frac), active.y, item.kind),
              }
            : item,
        ),
      );
      window.removeEventListener("pointermove", handlePointerMove);
      onDragState?.({ dragging: false, personId: null, isCanvas: false });
      if (!isCanvasTarget) return;
      onDropItem?.(
        {
          id: active.id,
          kind: active.kind,
          label: active.label,
          stickerKey: active.stickerKey,
          questionId: active.questionId,
        },
        { clientX: event.clientX, clientY: event.clientY, personId, relatedEntryId, isCanvasTarget },
      );
    },
    [handlePointerMove, itemOpacity, onDragState, onDropItem, shapeX],
  );

  const cancelDrag = useCallback(() => {
    const active = draggingWordRef.current;
    if (!active) return;
    draggingWordRef.current = null;
    setDraggingStreamId(null);
    setStreamItems((current) =>
      current.map((item) =>
        item.id === active.id
          ? {
              ...item,
              x: shapeX(active.y, item.frac),
              y: active.y,
              detourX: undefined,
              detourUntil: undefined,
              opacity: itemOpacity(shapeX(active.y, item.frac), active.y, item.kind),
            }
          : item,
      ),
    );
    window.removeEventListener("pointermove", handlePointerMove);
    onDragState?.({ dragging: false, personId: null, isCanvas: false });
  }, [handlePointerMove, itemOpacity, onDragState, shapeX]);

  const startDraggingItem = useCallback(
    (item: WaterfallItem, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!onDropItem) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      draggingWordRef.current = item;
      setDraggingStreamId(item.id);
      onDragState?.({ dragging: true, personId: null, isCanvas: false });
      window.removeEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
      window.removeEventListener("pointercancel", cancelDrag);
      window.addEventListener("pointercancel", cancelDrag, { once: true });
    },
    [cancelDrag, handlePointerMove, handlePointerUp, onDragState, onDropItem],
  );

  return (
    <div className={styles.waterfallLayer}>
      {streamItems.map((item) => {
        const isDragging = draggingStreamId === item.id;
        const className = `${styles.fallingWord} ${item.kind === "image" ? styles.fallingImage : ""} ${item.kind === "question" ? styles.fallingQuestion : ""} ${item.truncate ? styles.fallingTruncated : ""} ${item.href ? styles.fallingLink : ""}`.trim();
        const ariaLabel =
          item.kind === "word"
            ? `Add ${item.label}`
            : item.kind === "question"
              ? `Answer this week's question: ${item.questionLabel ?? item.label}`
              : `Add ${item.stickerKey} image`;
        const style = {
          left: item.x,
          top: item.y,
          opacity: item.opacity,
          pointerEvents: isDragging ? ("none" as const) : ("auto" as const),
        };
        if (item.href) {
          return (
            <a
              aria-label={item.label}
              className={className}
              data-stream-id={item.id}
              href={item.href}
              key={item.id}
              style={style}
              tabIndex={-1}
            >
              {item.label}
            </a>
          );
        }
        return (
          <button
            aria-label={ariaLabel}
            className={className}
            data-stream-id={item.id}
            key={item.id}
            onPointerDown={(event) => startDraggingItem(item, event)}
            style={style}
            type="button"
          >
            {item.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={item.imageSrc} />
            ) : (
              item.label
            )}
          </button>
        );
      })}
    </div>
  );
}
