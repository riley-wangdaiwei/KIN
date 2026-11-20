"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import TextFlowSection, { type TextFlowInstance } from "@/components/site/TextFlowSection";
import { buildStreamCycle } from "@/features/canvas/stream";
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

// The loop: each word falls into place, holds, then falls again. Timings
// mirror TextFlow's own fall (drop ~140px, staggered by row) stretched over
// a 6s cycle, so about a quarter of the words are falling at any moment.
const LOOP_DURATION_MS = 6000;
const LOOP_DELAY_SPREAD_MS = 1800;
const FALL_DROP_PX = 140;
const PAUSE_RADIUS_PX = 140;
const RESYNC_INTERVAL_MS = 2000;

type LoopAnim = {
  node: HTMLElement;
  anim: Animation;
  px: number;
  py: number;
};

function isReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mirrorKeyFor(element: HTMLElement): string {
  if (element.dataset.personId) return `person-${element.dataset.personId}`;
  if (element.dataset.canvasEntryId) return `entry-${element.dataset.canvasEntryId}`;
  return "footer";
}

function dropTargetFromPoint(clientX: number, clientY: number): {
  personId: string | null;
  relatedEntryId: string | null;
  isCanvasTarget: boolean;
} {
  const target = document.elementFromPoint(clientX, clientY);
  const personId = target?.closest<HTMLElement>("[data-person-id]")?.dataset.personId ?? null;
  const relatedEntryId = target?.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId ?? null;
  const isCanvasTarget = Boolean(target?.closest<HTMLElement>("[data-person-id], [data-canvas-area]"));
  return { personId, relatedEntryId, isCanvasTarget };
}

function startLoopAnim(
  node: HTMLElement,
  placement: { x: number; y: number },
  section: HTMLElement,
  delayOverride?: number,
): LoopAnim {
  const H = section.clientHeight || 1;
  const W = section.clientWidth || 1;
  const drop = FALL_DROP_PX * (0.6 + Math.random() * 0.8);
  const tilt = (Math.random() - 0.5) * 14;
  const { x, y } = placement;
  const delay =
    delayOverride ?? (y / H) * LOOP_DELAY_SPREAD_MS + (x / W) * 160 + Math.random() * 220;
  const anim = node.animate(
    [
      {
        transform: `translate(${x}px, ${y - drop}px) rotate(${tilt.toFixed(2)}deg)`,
        opacity: 0,
        easing: "cubic-bezier(.5,0,.9,.5)",
      },
      {
        transform: `translate(${x}px, ${y + 3}px) rotate(${(tilt * 0.15).toFixed(2)}deg)`,
        opacity: 1,
        offset: 0.18,
        easing: "cubic-bezier(.2,.6,.4,1)",
      },
      {
        transform: `translate(${x}px, ${y - 1.5}px) rotate(${(-tilt * 0.05).toFixed(2)}deg)`,
        offset: 0.23,
        easing: "ease-in-out",
      },
      { transform: `translate(${x}px, ${y}px) rotate(0deg)`, offset: 0.25 },
      { transform: `translate(${x}px, ${y}px) rotate(0deg)`, offset: 1 },
    ],
    { duration: LOOP_DURATION_MS, delay, iterations: Infinity, fill: "backwards" },
  );
  return { node, anim, px: x, py: y };
}

export default function CanvasStream({ question, onDragState, onDropItem }: CanvasStreamProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [instance, setInstance] = useState<TextFlowInstance | null>(null);
  const instanceRef = useRef<TextFlowInstance | null>(null);
  const [mirrorKeys, setMirrorKeys] = useState<string[] | null>(null);
  const mirrorKeysRef = useRef<string[]>([]);
  const mirrorRects = useRef(
    new Map<string, { left: number; top: number; width: number; height: number }>(),
  );
  const loopAnims = useRef<LoopAnim[]>([]);
  const draggingRef = useRef<{ item: StreamDropItem; node: HTMLElement; width: number } | null>(null);
  const hoverRef = useRef<{ personId: string | null; isCanvas: boolean } | null>(null);
  const nextItemId = useRef(1);
  const layoutTimer = useRef<number | null>(null);
  const pauseQueued = useRef(false);
  const syncQueued = useRef(false);

  const cycle = buildStreamCycle(question);
  const refreshKey = `${mirrorKeys?.join("|") ?? ""}#${question?.id ?? "none"}`;

  // Re-create loop animations for words whose placement changed (or that are
  // new); leave untouched words falling on their own schedule. With reduced
  // motion there is no loop — words just sit where TextFlow put them.
  const resyncLoop = useCallback(() => {
    const inst = instanceRef.current;
    const section = sectionRef.current;
    if (!inst || !section) return;
    const layer = section.querySelector(".tf-layer");
    if (isReducedMotion()) {
      loopAnims.current.forEach((entry) => entry.anim.cancel());
      loopAnims.current = [];
      layer?.classList.add("tf-live");
      return;
    }
    const placements = inst.placements;
    const nodes = inst.nodes;
    const byNode = new Map(loopAnims.current.map((entry) => [entry.node, entry]));
    const next: LoopAnim[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const placement = placements[i];
      if (!placement || node.style.display === "none") continue;
      // Never re-animate the word being dragged: its transform is driven
      // by the pointer until the drop, when it is restarted explicitly.
      if (draggingRef.current?.node === node) continue;
      const existing = byNode.get(node);
      if (existing && existing.px === placement.x && existing.py === placement.y) {
        next.push(existing);
        byNode.delete(node);
        continue;
      }
      existing?.anim.cancel();
      next.push(startLoopAnim(node, placement, section));
      byNode.delete(node);
    }
    byNode.forEach((entry) => entry.anim.cancel());
    loopAnims.current = next;
    layer?.classList.add("tf-live");
  }, []);

  const scheduleLayout = useCallback(() => {
    if (layoutTimer.current !== null) return;
    layoutTimer.current = window.setTimeout(() => {
      layoutTimer.current = null;
      const inst = instanceRef.current;
      if (!inst) return;
      inst.layout();
      resyncLoop();
    }, 150);
  }, [resyncLoop]);

  // Board elements live outside this section, so TextFlow cannot see them.
  // Mirror divs inside the section track their viewport rects, and TextFlow
  // wraps the fill around the mirrors instead.
  const syncMirrors = useCallback(() => {
    const targets = [
      ...document.querySelectorAll<HTMLElement>("[data-board-element], [data-canvas-obstacle]"),
    ];
    const keys = targets.map(mirrorKeyFor);
    if (keys.join("|") !== mirrorKeysRef.current.join("|")) {
      mirrorKeysRef.current = keys;
      setMirrorKeys(keys);
      // The mirrors render on the next commit; positions sync then.
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    const sectionRect = section.getBoundingClientRect();
    // Prune rects of mirrors that no longer exist.
    const keySet = new Set(keys);
    for (const key of [...mirrorRects.current.keys()]) {
      if (!keySet.has(key)) mirrorRects.current.delete(key);
    }
    let moved = false;
    for (let i = 0; i < targets.length; i++) {
      const mirror = section.querySelector<HTMLElement>(`[data-mirror-key="${keys[i]}"]`);
      if (!mirror) continue;
      const rect = targets[i].getBoundingClientRect();
      const box = {
        left: Math.round(rect.left - sectionRect.left),
        top: Math.round(rect.top - sectionRect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      const prev = mirrorRects.current.get(keys[i]);
      if (
        !prev ||
        prev.left !== box.left ||
        prev.top !== box.top ||
        prev.width !== box.width ||
        prev.height !== box.height
      ) {
        mirror.style.left = `${box.left}px`;
        mirror.style.top = `${box.top}px`;
        mirror.style.width = `${box.width}px`;
        mirror.style.height = `${box.height}px`;
        mirrorRects.current.set(keys[i], box);
        moved = true;
      }
    }
    if (moved) scheduleLayout();
  }, [scheduleLayout]);

  // Read the board targets after every render — the set changes when board
  // content is added or removed, and positions change on scroll and drag.
  useEffect(() => {
    syncMirrors();
  });

  // Start the loop once TextFlow's first layout lands, and re-sync it on a
  // slow interval so a layout TextFlow runs on its own (resize) is picked up.
  useEffect(() => {
    instanceRef.current = instance;
    if (!instance) {
      loopAnims.current.forEach((entry) => entry.anim.cancel());
      loopAnims.current = [];
      return;
    }
    if (isReducedMotion()) {
      sectionRef.current?.querySelector(".tf-layer")?.classList.add("tf-live");
      return;
    }
    let cancelled = false;
    const check = window.setInterval(() => {
      if (cancelled) return;
      if (instance.placements.length > 0) {
        window.clearInterval(check);
        syncMirrors();
        instance.layout();
        resyncLoop();
      }
    }, 50);
    const resyncTimer = window.setInterval(() => {
      if (!cancelled) resyncLoop();
    }, RESYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(check);
      window.clearInterval(resyncTimer);
      loopAnims.current.forEach((entry) => entry.anim.cancel());
      loopAnims.current = [];
    };
  }, [instance, resyncLoop, syncMirrors]);

  const pauseNearPointer = useCallback((clientX: number, clientY: number) => {
    const section = sectionRef.current;
    if (!section || draggingRef.current) return;
    const rect = section.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (const entry of loopAnims.current) {
      const near =
        Math.abs(entry.px - x) < PAUSE_RADIUS_PX && entry.py > y - 220 && entry.py < y + 40;
      if (near) entry.anim.pause();
      else entry.anim.play();
    }
  }, []);

  const pauseAllLoop = useCallback(() => {
    loopAnims.current.forEach((entry) => entry.anim.pause());
  }, []);

  const resumeAllLoop = useCallback(() => {
    loopAnims.current.forEach((entry) => entry.anim.play());
  }, []);

  const restartNode = useCallback((node: HTMLElement, delay: number) => {
    const inst = instanceRef.current;
    const section = sectionRef.current;
    if (!inst || !section) return;
    const index = inst.nodes.indexOf(node);
    const placement = inst.placements[index];
    if (!placement) return;
    if (isReducedMotion()) {
      // No loop: put the word back where TextFlow placed it.
      node.style.transform = `translate(${placement.x}px, ${placement.y}px)`;
      return;
    }
    loopAnims.current = loopAnims.current.filter((entry) => entry.node !== node);
    loopAnims.current.push(startLoopAnim(node, placement, section, delay));
  }, []);

  const handleDragMove = useCallback(
    (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      drag.node.style.transform = `translate(${px - drag.width / 2}px, ${py - 14}px)`;
      const { personId, isCanvasTarget } = dropTargetFromPoint(event.clientX, event.clientY);
      const hover = { personId, isCanvas: isCanvasTarget };
      if (
        hover.personId !== hoverRef.current?.personId ||
        hover.isCanvas !== hoverRef.current?.isCanvas
      ) {
        hoverRef.current = hover;
        onDragState({ dragging: true, personId, isCanvas: isCanvasTarget });
      }
    },
    [onDragState],
  );

  const handleDragUp = useCallback(
    (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      // Read the drop target BEFORE lifting the dragging class: while the
      // class is on, every word ignores the pointer and elementFromPoint
      // sees the board; without it, it would hit the dragged word itself.
      const { personId, relatedEntryId, isCanvasTarget } = dropTargetFromPoint(
        event.clientX,
        event.clientY,
      );
      draggingRef.current = null;
      hoverRef.current = null;
      sectionRef.current?.classList.remove(styles.dragging);
      resumeAllLoop();
      restartNode(drag.node, 0);
      onDragState({ dragging: false, personId: null, isCanvas: false });
      onDropItem(drag.item, {
        clientX: event.clientX,
        clientY: event.clientY,
        personId,
        relatedEntryId,
        isCanvasTarget,
      });
    },
    [onDragState, onDropItem, resumeAllLoop, restartNode],
  );

  const cancelDrag = useCallback(() => {
    const drag = draggingRef.current;
    if (!drag) return;
    draggingRef.current = null;
    hoverRef.current = null;
    sectionRef.current?.classList.remove(styles.dragging);
    resumeAllLoop();
    restartNode(drag.node, 0);
    onDragState({ dragging: false, personId: null, isCanvas: false });
  }, [onDragState, resumeAllLoop, restartNode]);

  // One window listener set for the pointer: while a word is dragged it
  // drives the node and the drop target; otherwise it pauses the words
  // near the pointer so they hold still long enough to grab.
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (draggingRef.current) {
        handleDragMove(event);
        return;
      }
      if (pauseQueued.current) return;
      pauseQueued.current = true;
      requestAnimationFrame(() => {
        pauseQueued.current = false;
        if (!draggingRef.current) pauseNearPointer(event.clientX, event.clientY);
      });
    };
    const onPointerUp = (event: PointerEvent) => {
      if (draggingRef.current) handleDragUp(event);
    };
    const onPointerCancel = () => {
      if (draggingRef.current) cancelDrag();
    };
    const onPointerLeave = () => {
      if (!draggingRef.current) resumeAllLoop();
    };
    const onScroll = () => {
      if (syncQueued.current) return;
      syncQueued.current = true;
      requestAnimationFrame(() => {
        syncQueued.current = false;
        syncMirrors();
      });
    };
    const onResize = () => syncMirrors();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [cancelDrag, handleDragMove, handleDragUp, pauseNearPointer, resumeAllLoop, syncMirrors]);

  const handleWordPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const node = (event.target as HTMLElement).closest(".tf-w") as HTMLElement | null;
    if (!node) return;
    const kind = node.dataset.kind as StreamDropItem["kind"] | undefined;
    if (!kind) return;
    event.preventDefault();
    const item: StreamDropItem = {
      id: nextItemId.current++,
      kind,
      label: node.dataset.label,
      stickerKey: node.dataset.stickerKey,
      questionId: node.dataset.questionId,
    };
    const entry = loopAnims.current.find((candidate) => candidate.node === node);
    if (entry) {
      entry.anim.cancel();
      loopAnims.current = loopAnims.current.filter((candidate) => candidate.node !== node);
    }
    const width = node.getBoundingClientRect().width;
    draggingRef.current = { item, node, width };
    sectionRef.current?.classList.add(styles.dragging);
    pauseAllLoop();
    onDragState({ dragging: true, personId: null, isCanvas: false });
  };

  if (mirrorKeys === null) {
    // Board targets are read after mount; the section mounts once they are
    // known, so TextFlow sees the full mirror set on its first layout.
    return null;
  }

  return (
    <TextFlowSection
      ariaLabel="Add to your canvas"
      className={styles.canvasFlow}
      fall={false}
      onInstance={setInstance}
      onPointerDown={handleWordPointerDown}
      ref={sectionRef}
      refreshKey={refreshKey}
      shape="fill"
      style={{
        position: "fixed",
        top: 76,
        right: 0,
        bottom: 56,
        left: 0,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      <div aria-hidden="true" data-flow-source>
        {cycle.map((item, index) =>
          item.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className={styles.streamSticker}
              data-flow-token
              data-kind="image"
              data-sticker-key={item.stickerKey}
              key={index}
              src={item.imageSrc}
            />
          ) : item.kind === "question" ? (
            <span key={index}>
              {item.label?.split(/\s+/).map((word, wordIndex) => (
                <span
                  className={styles.questionWord}
                  data-flow-token
                  data-kind="question"
                  data-question-id={item.questionId}
                  key={wordIndex}
                >
                  {word}
                </span>
              ))}
            </span>
          ) : (
            <span data-flow-token data-kind="word" data-label={item.label} key={index}>
              {item.label}
            </span>
          ),
        )}
      </div>
      {mirrorKeys.map((key) => (
        <div
          aria-hidden="true"
          className={styles.streamMirror}
          data-flow-obstacle
          data-mirror-key={key}
          key={key}
        />
      ))}
    </TextFlowSection>
  );
}
