"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { buildStreamRows, type StreamRowTemplate } from "@/features/canvas/stream";
import type { CommunityQuestion } from "@/lib/storage/canvas-adapter";
import styles from "./canvas-workspace.module.css";

// One draggable stream item, as the drop dispatch in CanvasWorkspace reads it.
export type StreamDropItem = {
  id: number;
  kind: "word" | "image" | "question";
  label?: string;
  stickerKey?: string;
  questionId?: string;
};

export type StreamDropTarget = {
  clientX: number;
  clientY: number;
  personId: string | null;
  relatedEntryId: string | null;
  isCanvasTarget: boolean;
};

export type StreamDragState = {
  dragging: boolean;
  personId: string | null;
  isCanvas: boolean;
};

type CanvasStreamProps = {
  question: CommunityQuestion | null;
  onDragState: (state: StreamDragState) => void;
  onDropItem: (item: StreamDropItem, target: StreamDropTarget) => void;
};

// The original stream, restored: a narrow column on the right edge, items
// scrolling steadily down and recycling at the top — no dense fill, the
// board stays clean and words only live in the stream.
const STREAM_ROW_HEIGHT = 28;
const STREAM_SPEED = 1.25;
// The fall is shaped like the community page's waterfall (TextFlow's
// numbers: narrow at the top, wider toward the bottom) and anchored to the
// right: the stream region is the right 38% of the viewport and the fall is
// centered at 72% of the region, so it hugs the right edge at the top and
// spreads leftward as items fall.
const REGION_SHARE = 0.38;
const SHAPE_CENTER = 0.72;
const SHAPE_TOP = 0.1;
const SHAPE_BOTTOM = 0.6;
const SHAPE_CURVE = 2.6;
const HEADER_PX = 76;
const FOOTER_PX = 56;

type StreamItem = StreamRowTemplate & {
  id: number;
  x: number;
  y: number;
  speed: number;
  // Lateral position inside the fall (0 = left edge, 1 = right edge), fixed
  // for the item's whole fall — as the fall widens, the item drifts outward.
  frac: number;
  detourUntil?: number;
  detourX?: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Left/right edge of the fall at viewport height y, in viewport coords.
function streamBounds(y: number): [number, number] {
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;
  const regionLeft = innerWidth * (1 - REGION_SHARE);
  const regionWidth = innerWidth * REGION_SHARE;
  const t = clamp01((y - HEADER_PX) / Math.max(1, innerHeight - HEADER_PX - FOOTER_PX));
  const share = SHAPE_TOP + (SHAPE_BOTTOM - SHAPE_TOP) * Math.pow(t, SHAPE_CURVE);
  const half = (share * regionWidth) / 2;
  const center = regionLeft + SHAPE_CENTER * regionWidth;
  return [center - half, center + half];
}

function shapeX(y: number, frac: number): number {
  const [left, right] = streamBounds(y);
  return left + frac * (right - left);
}

// Words near the fall's edges are fainter, like the community fall.
function fadeFor(x: number, y: number): number {
  const [left, right] = streamBounds(y);
  const edge = Math.min(x - left, right - x) / Math.max(1, (right - left) / 2);
  return 0.35 + 0.65 * Math.min(1, edge * 2.2);
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

export default function CanvasStream({ question, onDragState, onDropItem }: CanvasStreamProps) {
  const templates = useMemo(() => buildStreamRows(question), [question]);
  const templatesRef = useRef(templates);
  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const streamRef = useRef<StreamItem[]>([]);
  const draggingWordRef = useRef<StreamItem | null>(null);
  const [draggingStreamId, setDraggingStreamId] = useState<number | null>(null);
  const nextStreamId = useRef(1);
  const nextSequenceIndex = useRef(0);
  const pointerNearStream = useRef(false);
  const seededForRef = useRef<string | null | undefined>(undefined);
  const reducedMotion = isReducedMotion();

  useEffect(() => {
    streamRef.current = streamItems;
  }, [streamItems]);

  const seed = useCallback(() => {
    if (typeof window === "undefined") return;
    const sequence = templatesRef.current;
    if (sequence.length === 0) return;
    const count = Math.ceil(window.innerHeight / STREAM_ROW_HEIGHT) + 1;
    const startIndex = Math.floor(Math.random() * sequence.length);
    const verticalOffset = Math.random() * STREAM_ROW_HEIGHT;
    const items = Array.from({ length: count }).map((_, index) => {
      const template = sequence[(startIndex + index) % sequence.length];
      const y = index * STREAM_ROW_HEIGHT - STREAM_ROW_HEIGHT + verticalOffset;
      const frac = Math.random();
      return {
        ...template,
        id: index + 1,
        x: shapeX(y, frac),
        y,
        speed: STREAM_SPEED,
        frac,
      };
    });
    nextStreamId.current = count + 1;
    nextSequenceIndex.current = startIndex + count;
    streamRef.current = items;
    setStreamItems(items);
  }, []);

  // Seed once at mount, and again if the weekly question arrives later.
  useEffect(() => {
    const questionId = question?.id ?? null;
    if (streamRef.current.length === 0 || seededForRef.current !== questionId) {
      seededForRef.current = questionId;
      seed();
    }
  }, [question, seed]);

  useEffect(() => {
    const updatePointerProximity = (event: PointerEvent) => {
      pointerNearStream.current =
        event.clientX >= window.innerWidth * (1 - REGION_SHARE) - 60;
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
          const frac = Math.random();
          return {
            ...template,
            id: nextStreamId.current++,
            x: shapeX(y, frac),
            y,
            speed: STREAM_SPEED,
            frac,
          };
        }
        return { ...item, x: nextX, y: nextY, detourUntil, detourX };
      });

      streamRef.current = items;
      setStreamItems(items);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

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
        const frac = Math.random();
        return {
          ...template,
          id: nextStreamId.current++,
          x: shapeX(y, frac),
          y,
          speed: STREAM_SPEED,
          frac,
        };
      });
      const items = [...extra, ...current];
      streamRef.current = items;
      setStreamItems(items);
    };
    window.addEventListener("resize", topUp);
    return () => window.removeEventListener("resize", topUp);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const active = draggingWordRef.current;
      if (!active) return;
      const { personId, isCanvasTarget } = dropTargetFromPoint(event.clientX, event.clientY);
      onDragState({ dragging: true, personId, isCanvas: isCanvasTarget });
      setStreamItems((current) =>
        current.map((item) =>
          item.id === active.id ? { ...item, x: event.clientX, y: event.clientY } : item,
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
              }
            : item,
        ),
      );
      window.removeEventListener("pointermove", handlePointerMove);
      onDragState({ dragging: false, personId: null, isCanvas: false });
      if (!isCanvasTarget) return;
      onDropItem(
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
    [handlePointerMove, onDragState, onDropItem],
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
            }
          : item,
      ),
    );
    window.removeEventListener("pointermove", handlePointerMove);
    onDragState({ dragging: false, personId: null, isCanvas: false });
  }, [handlePointerMove, onDragState]);

  const startDraggingItem = useCallback(
    (item: StreamItem, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      draggingWordRef.current = item;
      setDraggingStreamId(item.id);
      onDragState({ dragging: true, personId: null, isCanvas: false });
      window.removeEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
      window.removeEventListener("pointercancel", cancelDrag);
      window.addEventListener("pointercancel", cancelDrag, { once: true });
    },
    [cancelDrag, handlePointerMove, handlePointerUp, onDragState],
  );

  return (
    <div className={styles.waterfallLayer}>
      {streamItems.map((item) => {
        // Keep the stream clear of the fixed header and the fixed site
        // footer: items are still tracked by the engine, just not drawn
        // while they pass behind the chrome.
        if (item.y < HEADER_PX || item.y > window.innerHeight - FOOTER_PX) return null;
        const opacity = item.kind === "image" ? 1 : fadeFor(item.x, item.y);
        return (
          <button
            className={`${styles.fallingWord} ${item.kind === "image" ? styles.fallingImage : ""} ${item.kind === "question" ? styles.fallingQuestion : ""}`.trim()}
            data-stream-id={item.id}
            key={item.id}
            onPointerDown={(event) => startDraggingItem(item, event)}
            style={{
              left: item.x,
              top: item.y,
              opacity,
              pointerEvents: draggingStreamId === item.id ? "none" : "auto",
            }}
            aria-label={
              item.kind === "word"
                ? `Add ${item.label}`
                : item.kind === "question"
                  ? `Answer this week's question: ${item.questionLabel ?? item.label}`
                  : `Add ${item.stickerKey} image`
            }
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
