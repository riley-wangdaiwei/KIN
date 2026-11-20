"use client";

import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCanvasImage,
  createCanvasImageFromUrl,
  createCanvasPerson,
  createCanvasShare,
  createCanvasSticker,
  createCanvasStickerUpload,
  createCanvasText,
  deleteCanvasEntry,
  deleteCanvasPerson,
  getCanvasPublication,
  getCanvasUser,
  getCurrentCommunityQuestion,
  loadCanvas,
  placeCanvasEntry,
  publishCanvas,
  renameCanvasPerson,
  subscribeToCanvasAuth,
  unpublishCanvas,
  updateCanvasEntryFontSize,
  updateCanvasEntryPosition,
  updateCanvasEntrySize,
  updateCanvasPersonPosition,
  updateCanvasPersonSize,
} from "@/lib/storage/canvas-adapter";
import type { CanvasPublication, CommunityQuestion } from "@/lib/storage/canvas-adapter";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import type { BoardPosition } from "@/features/canvas/positions";
import { resolveBoardPositions } from "@/features/canvas/positions";
import AlphabetName from "./AlphabetName";
import styles from "./canvas-workspace.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };
const providedStickerKeys = ["humankind", "rekin", "love", "foto"] as const;
const STREAM_ROW_HEIGHT = 28;
const STREAM_SPEED = 1.25;
const stickerImageSources: Record<string, string> = {
  humankind: "/stickers/humankind.png",
  rekin: "/stickers/rekin.png",
  love: "/stickers/love.png",
  foto: "/stickers/foto.png",
};
type StreamItem = {
  id: number;
  kind: "word" | "image" | "question";
  label?: string;
  imageSrc?: string;
  x: number;
  y: number;
  speed: number;
  detourUntil?: number;
  detourX?: number;
  stickerKey?: string;
  questionId?: string;
};

type InlinePrompt = {
  kind: "details" | "people" | "question";
  personId: string | null;
  x: number;
  y: number;
  boardX: number;
  boardY: number;
  questionId?: string;
};

type PendingUpload = {
  kind: "image" | "sticker";
  personId: string | null;
  relatedEntryId: string | null;
  boardX: number;
  boardY: number;
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function applyBoardPosition(
  previous: GiftingCanvas,
  kind: "person" | "entry",
  id: string,
  position: BoardPosition,
  personId?: string | null,
): GiftingCanvas {
  if (kind === "person") {
    return {
      ...previous,
      people: previous.people.map((person) =>
        person.id === id ? { ...person, posX: position.x, posY: position.y } : person,
      ),
    };
  }
  const allEntries = [
    ...previous.unsorted,
    ...previous.people.flatMap((person) => person.entries),
  ];
  const entry = allEntries.find((candidate) => candidate.id === id);
  if (!entry) return previous;
  const nextPersonId = personId === undefined ? entry.personId : personId;
  const moved: CanvasEntry = { ...entry, posX: position.x, posY: position.y, personId: nextPersonId };
  const removeFrom = (entries: CanvasEntry[]) => entries.filter((candidate) => candidate.id !== id);
  const updateIn = (entries: CanvasEntry[]) =>
    entries.map((candidate) => (candidate.id === id ? moved : candidate));
  let people = previous.people;
  let unsorted = previous.unsorted;
  if (entry.personId === null) {
    unsorted = nextPersonId === null ? updateIn(unsorted) : removeFrom(unsorted);
  } else {
    people = people.map((person) =>
      person.id === entry.personId
        ? {
            ...person,
            entries: nextPersonId === entry.personId ? updateIn(person.entries) : removeFrom(person.entries),
          }
        : person,
    );
  }
  if (nextPersonId !== null && nextPersonId !== entry.personId) {
    people = people.map((person) =>
      person.id === nextPersonId ? { ...person, entries: [...person.entries, moved] } : person,
    );
  }
  if (nextPersonId === null && entry.personId !== null) {
    unsorted = [...unsorted, moved];
  }
  return { people, unsorted };
}

function buildStreamSequence(question: CommunityQuestion | null = null) {
  const stickerImages = providedStickerKeys.map((key) => ({
    kind: "image" as const,
    imageSrc: stickerImageSources[key],
    stickerKey: key,
  }));
  const cycle = [
    { kind: "word", label: "stickers" },
    { kind: "word", label: "details" },
    { kind: "word", label: "people" },
    { kind: "word", label: "stickers" },
    { kind: "word", label: "details" },
    { kind: "word", label: "people" },
    { kind: "word", label: "images" },
    { kind: "word", label: "jars" },
    ...stickerImages,
    // The weekly community question rides the waterfall once per cycle, so
    // it shows up in the user's own stream without taking it over.
    ...(question
      ? [{ kind: "question" as const, label: question.question, questionId: question.id }]
      : []),
  ] as const;

  return cycle.map((item) => ({ ...item }));
}

function getColumnX() {
  if (typeof window === "undefined") return 0;
  return Math.max(48, window.innerWidth - 100);
}

function makeStreamItem(id: number, index: number, startIndex: number, verticalOffset: number, question: CommunityQuestion | null = null): StreamItem {
  const sequence = buildStreamSequence(question);
  const template = sequence[(startIndex + index) % sequence.length];

  return {
    id,
    kind: template.kind,
    label: template.kind === "word" || template.kind === "question" ? template.label : undefined,
    imageSrc: template.kind === "image" ? template.imageSrc : undefined,
    stickerKey: template.kind === "image" ? template.stickerKey : undefined,
    questionId: template.kind === "question" ? template.questionId : undefined,
    x: getColumnX(),
    y: index * STREAM_ROW_HEIGHT - STREAM_ROW_HEIGHT + verticalOffset,
    speed: STREAM_SPEED,
  };
}

function getInitialStreamItems(question: CommunityQuestion | null = null) {
  if (typeof window === "undefined") return { items: [] as StreamItem[], nextSequenceIndex: 0 };
  const count = Math.ceil(window.innerHeight / STREAM_ROW_HEIGHT) + 1;
  const sequenceLength = buildStreamSequence(question).length;
  const startIndex = Math.floor(Math.random() * sequenceLength);
  const verticalOffset = Math.random() * STREAM_ROW_HEIGHT;
  return {
    items: Array.from({ length: count }).map((_, index) => makeStreamItem(index + 1, index, startIndex, verticalOffset, question)),
    nextSequenceIndex: startIndex + count,
  };
}

export default function CanvasWorkspace() {
  const [canvas, setCanvas] = useState<GiftingCanvas>(emptyCanvas);
  const [userId, setUserId] = useState<string | null>(null);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [currentQuestion, setCurrentQuestion] = useState<CommunityQuestion | null>(null);
  const [questionLoaded, setQuestionLoaded] = useState(false);
  const [publication, setPublication] = useState<CanvasPublication | null>(null);
  const [publishFormOpen, setPublishFormOpen] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const generalImageInputRef = useRef<HTMLInputElement>(null);
  const [inlinePrompt, setInlinePrompt] = useState<InlinePrompt | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [dropTargetPerson, setDropTargetPerson] = useState<string | null>(null);
  const [dropTargetCanvas, setDropTargetCanvas] = useState(false);
  const [streamDragging, setStreamDragging] = useState(false);
  const [draggingStreamId, setDraggingStreamId] = useState<number | null>(null);
  const streamRef = useRef<StreamItem[]>([]);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const draggingWordRef = useRef<StreamItem | null>(null);
  const nextStreamId = useRef(1);
  const nextSequenceIndex = useRef(0);
  const nextJarFrame = useRef(0);
  const pointerNearStream = useRef(false);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const boardDragRef = useRef<{
    kind: "person" | "entry";
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [dragOverride, setDragOverride] = useState<{
    kind: "person" | "entry";
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const justDraggedRef = useRef(false);
  const [namePreviewSize, setNamePreviewSize] = useState<{ id: string; size: number } | null>(null);
  const personResizeStart = useRef<{ x: number; y: number; size: number; id: string } | null>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    streamRef.current = streamItems;
  }, [streamItems]);

  const board = useMemo(
    () => resolveBoardPositions(canvas.people, canvas.unsorted),
    [canvas],
  );

  useEffect(() => {
    const updatePointerProximity = (event: PointerEvent) => {
      const columnX = getColumnX();
      pointerNearStream.current = event.clientX >= columnX - 100 && event.clientX <= window.innerWidth;
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
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreamItems([]);
      streamRef.current = [];
      return;
    }
    if (loading || !questionLoaded || streamRef.current.length > 0) return;

    const initial = getInitialStreamItems(currentQuestion);
    const active = initial.items;
    nextStreamId.current = active.length + 1;
    nextSequenceIndex.current = initial.nextSequenceIndex;
    setStreamItems(active);
    streamRef.current = active;
  }, [currentQuestion, loading, questionLoaded, reducedMotion, userId]);

  useEffect(() => {
    if (!userId || loading || reducedMotion) return;

    let frame = 0;
    const tick = () => {
      if (draggingWordRef.current || pointerNearStream.current) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const sequence = buildStreamSequence(currentQuestion);
      const hitAreas = [...document.querySelectorAll<HTMLElement>(
        `[data-board-element], [data-canvas-obstacle]`,
      )].map((element) => element.getBoundingClientRect());
      const items = streamRef.current.map((item) => {
        if (draggingWordRef.current?.id === item.id) return item;
        const nextY = item.y + item.speed;
        const element = document.querySelector<HTMLElement>(`[data-stream-id="${item.id}"]`);
        const rect = element?.getBoundingClientRect();
        const width = rect?.width ?? 90;
        const height = rect?.height ?? STREAM_ROW_HEIGHT;
        const hit = hitAreas.find((area) =>
          item.x + width / 2 > area.left && item.x - width / 2 < area.right &&
          nextY + height / 2 > area.top && nextY - height / 2 < area.bottom,
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
        const targetX = detourX ?? getColumnX();
        const nextX = item.x + Math.max(-20, Math.min(20, targetX - item.x));
        if (nextY > window.innerHeight + height) {
          const template = sequence[nextSequenceIndex.current % sequence.length];
          nextSequenceIndex.current += 1;
          return {
            id: nextStreamId.current++,
            kind: template.kind,
            label: template.kind === "word" || template.kind === "question" ? template.label : undefined,
            imageSrc: template.kind === "image" ? template.imageSrc : undefined,
            stickerKey: template.kind === "image" ? template.stickerKey : undefined,
            questionId: template.kind === "question" ? template.questionId : undefined,
            x: getColumnX(),
            y: Math.min(...streamRef.current.map((candidate) => candidate.y)) - STREAM_ROW_HEIGHT,
            speed: STREAM_SPEED,
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
  }, [currentQuestion, loading, reducedMotion, userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCanvas(await loadCanvas());
      setError("");
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const perform = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (actionError) {
      setError(messageFrom(actionError));
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const toBoardPoint = useCallback((clientX: number, clientY: number): BoardPosition => {
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    if (!rect) return { x: Math.max(0, Math.round(clientX)), y: Math.max(0, Math.round(clientY)) };
    return {
      x: Math.max(0, Math.round(clientX - rect.left)),
      y: Math.max(0, Math.round(clientY - rect.top)),
    };
  }, []);

  const saveBoardPosition = useCallback(async (
    kind: "person" | "entry",
    id: string,
    position: BoardPosition,
    personId?: string | null,
  ) => {
    setCanvas((previous) => applyBoardPosition(previous, kind, id, position, personId));
    try {
      if (kind === "person") {
        await updateCanvasPersonPosition(id, position);
      } else if (personId !== undefined) {
        await placeCanvasEntry(id, personId, position);
      } else {
        await updateCanvasEntryPosition(id, position);
      }
    } catch (saveError) {
      setError(messageFrom(saveError));
      await refresh();
    }
  }, [refresh]);

  const handleBoardPointerMove = useCallback((event: PointerEvent) => {
    const drag = boardDragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    setDragOverride({
      kind: drag.kind,
      id: drag.id,
      x: Math.max(0, Math.round(drag.startX + dx)),
      y: Math.max(0, Math.round(drag.startY + dy)),
    });
  }, []);

  const cancelBoardDrag = useCallback(() => {
    boardDragRef.current = null;
    window.removeEventListener("pointermove", handleBoardPointerMove);
    setDragOverride(null);
  }, [handleBoardPointerMove]);

  const handleBoardPointerUp = useCallback((event: PointerEvent) => {
    const drag = boardDragRef.current;
    boardDragRef.current = null;
    window.removeEventListener("pointermove", handleBoardPointerMove);
    window.removeEventListener("pointercancel", cancelBoardDrag);
    if (!drag) return;
    const position = {
      x: Math.max(0, Math.round(drag.startX + event.clientX - drag.startClientX)),
      y: Math.max(0, Math.round(drag.startY + event.clientY - drag.startClientY)),
    };
    setDragOverride(null);
    if (!drag.moved) return;
    justDraggedRef.current = true;
    window.setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
    let personId: string | null | undefined;
    if (drag.kind === "entry") {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      personId = target?.closest<HTMLElement>("[data-person-id]")?.dataset.personId ?? undefined;
    }
    void saveBoardPosition(drag.kind, drag.id, position, personId);
  }, [handleBoardPointerMove, saveBoardPosition, cancelBoardDrag]);

  const startBoardDrag = useCallback((
    kind: "person" | "entry",
    id: string,
    x: number,
    y: number,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    // The person name is a button (click renames), but it is also the drag
    // handle for the whole name block; every other control still blocks drag.
    if (target?.closest("button, input, textarea, a, select") && !target.closest("[data-board-drag-handle]")) return;
    event.preventDefault();
    boardDragRef.current = {
      kind,
      id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: x,
      startY: y,
      moved: false,
    };
    setDragOverride({ kind, id, x, y });
    window.removeEventListener("pointermove", handleBoardPointerMove);
    window.addEventListener("pointermove", handleBoardPointerMove);
    window.removeEventListener("pointerup", handleBoardPointerUp);
    window.addEventListener("pointerup", handleBoardPointerUp, { once: true });
    window.removeEventListener("pointercancel", cancelBoardDrag);
    window.addEventListener("pointercancel", cancelBoardDrag, { once: true });
  }, [handleBoardPointerMove, handleBoardPointerUp, cancelBoardDrag]);

  const startPersonResize = useCallback((person: CanvasPerson, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const heading = event.currentTarget.closest("[data-person-id]")?.querySelector("h3");
    const currentSize = namePreviewSize?.id === person.id
      ? namePreviewSize.size
      : person.nameSize ?? (heading ? Math.round(parseFloat(getComputedStyle(heading).fontSize)) : 96);
    personResizeStart.current = { x: event.clientX, y: event.clientY, size: currentSize, id: person.id };
    const clampSize = (size: number) => Math.round(Math.min(240, Math.max(24, size)));
    const updatePreview = (moveEvent: PointerEvent) => {
      const start = personResizeStart.current;
      if (!start) return;
      setNamePreviewSize({ id: start.id, size: clampSize(start.size + (moveEvent.clientX - start.x + moveEvent.clientY - start.y) / 2) });
    };
    const finishResize = (upEvent: PointerEvent) => {
      const start = personResizeStart.current;
      if (!start) return;
      const size = clampSize(start.size + (upEvent.clientX - start.x + upEvent.clientY - start.y) / 2);
      personResizeStart.current = null;
      window.removeEventListener("pointermove", updatePreview);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
      setNamePreviewSize({ id: start.id, size });
      void perform(() => updateCanvasPersonSize(start.id, size));
    };
    const cancelResize = () => {
      personResizeStart.current = null;
      window.removeEventListener("pointermove", updatePreview);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
      setNamePreviewSize(null);
    };
    window.addEventListener("pointermove", updatePreview);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", cancelResize);
  }, [namePreviewSize, perform]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const active = draggingWordRef.current;
    if (!active) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const personElement = target?.closest<HTMLElement>("[data-person-id]");
    const canvasElement = target?.closest<HTMLElement>(`.${styles.canvasArea}`);
    const isCanvasTarget = Boolean(personElement || canvasElement);
    setStreamDragging(isCanvasTarget);
    setDropTargetPerson(personElement?.dataset.personId ?? null);
    setDropTargetCanvas(Boolean(canvasElement && !personElement));

    setStreamItems((current) =>
      current.map((item) =>
        item.id === active.id ? { ...item, x: event.clientX, y: event.clientY } : item,
      ),
    );
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    const active = draggingWordRef.current;
    if (!active) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const entryElement = target?.closest<HTMLElement>("[data-entry-id]");
    const relatedEntryId = entryElement?.dataset.entryId ?? null;
    const personElement = target?.closest<HTMLElement>("[data-person-id]");
    const personId = personElement?.dataset.personId ?? null;
    const isCanvasTarget = Boolean(target?.closest<HTMLElement>(`[data-person-id], .${styles.canvasArea}`));

    draggingWordRef.current = null;
    setDraggingStreamId(null);
    setDropTargetPerson(null);
    setDropTargetCanvas(false);
    setStreamDragging(false);
    setStreamItems((current) => current.map((item) => item.id === active.id
      ? { ...item, x: getColumnX(), y: active.y, detourX: undefined, detourUntil: undefined }
      : item));
    window.removeEventListener("pointermove", handlePointerMove);

    if (!isCanvasTarget) {
      return;
    }

    const boardPoint = toBoardPoint(event.clientX, event.clientY);

    if (active.kind === "word" && (active.label === "details" || active.label === "people")) {
      setInlinePrompt({ kind: active.label, personId, x: event.clientX, y: event.clientY, boardX: boardPoint.x, boardY: boardPoint.y });
      setInlineValue("");
      return;
    }

    if (active.kind === "question") {
      setInlinePrompt({ kind: "question", personId, questionId: active.questionId, x: event.clientX, y: event.clientY, boardX: boardPoint.x, boardY: boardPoint.y });
      setInlineValue("");
      return;
    }

    if (active.kind === "word" && active.label === "images") {
      setPendingUpload({ kind: "image", personId, relatedEntryId, boardX: boardPoint.x, boardY: boardPoint.y });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "stickers") {
      setPendingUpload({ kind: "sticker", personId, relatedEntryId, boardX: boardPoint.x, boardY: boardPoint.y });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "jars") {
      const frame = [0, 4, 9, 14, 18][nextJarFrame.current % 5];
      nextJarFrame.current += 1;
      void perform(() => createCanvasImageFromUrl(`/jar/frames/vase_${String(frame + 1).padStart(2, "0")}.webp`, personId, relatedEntryId, boardPoint));
      return;
    }

    if (active.kind === "image") {
      void perform(async () => {
        if (!active.stickerKey) return;
        await createCanvasSticker(active.stickerKey, personId, relatedEntryId, boardPoint);
      });
    }
  }, [handlePointerMove, perform, toBoardPoint]);

  const startDraggingItem = useCallback((item: StreamItem, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    draggingWordRef.current = item;
    setDraggingStreamId(item.id);
    setStreamDragging(true);
    setDropTargetPerson(null);
    setDropTargetCanvas(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [handlePointerMove, handlePointerUp]);

  // The weekly question and the publication state ride along with the
  // session. A missing table (migration not applied yet) just means no
  // question and no publication; the publish action surfaces real errors.
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentQuestion(null);
      setQuestionLoaded(false);
      setPublication(null);
      return;
    }
    let active = true;
    void getCurrentCommunityQuestion()
      .then((question) => {
        if (active) setCurrentQuestion(question);
      })
      .catch(() => {
        if (active) setCurrentQuestion(null);
      })
      .finally(() => {
        if (active) setQuestionLoaded(true);
      });
    void getCanvasPublication()
      .then((row) => {
        if (active) setPublication(row);
      })
      .catch(() => {
        if (active) setPublication(null);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const unsubscribe = subscribeToCanvasAuth((user) => {
      if (!active) return;
      setUserId(user?.id ?? null);
      if (user) {
        void refresh();
      } else {
        setCanvas(emptyCanvas);
        setLoading(false);
      }
    });

    void getCanvasUser()
      .then((user) => {
        if (!active) return;
        setUserId(user?.id ?? null);
        if (user) void refresh();
        else setLoading(false);
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setError(messageFrom(sessionError));
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  async function handleImageSelection(file: File | undefined, relatedEntryId: string | null, targetPersonId: string | null) {
    if (!file) return;
    const position = pendingUpload ? { x: pendingUpload.boardX, y: pendingUpload.boardY } : null;
    if (pendingUpload?.kind === "sticker") {
      await perform(() => createCanvasStickerUpload(file, targetPersonId, relatedEntryId, position));
      setPendingUpload(null);
      return;
    }
    await perform(() => createCanvasImage(file, relatedEntryId, targetPersonId, position));
    setPendingUpload(null);
  }

  async function saveInlinePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inlinePrompt || !inlineValue.trim()) return;
    const value = inlineValue.trim();
    const position = { x: inlinePrompt.boardX, y: inlinePrompt.boardY };
    await perform(() => {
      if (inlinePrompt.kind === "question") {
        // An answer is a normal text entry on the board, linked to its
        // question so it is collected into the community canvas.
        return createCanvasText(value, inlinePrompt.personId, position, inlinePrompt.questionId ?? null);
      }
      return inlinePrompt.kind === "details"
        ? createCanvasText(value, inlinePrompt.personId, position)
        : createCanvasPerson(value, position);
    });
    setInlinePrompt(null);
    setInlineValue("");
  }

  async function publishCanvasWithName() {
    if (!publishName.trim()) return;
    setPublishBusy(true);
    setPublishStatus("");
    try {
      const row = await publishCanvas(publishName.trim());
      setPublication(row);
      setPublishFormOpen(false);
      setPublishName("");
      setPublishStatus(`Published as “${row.name}”.`);
    } catch (publishError) {
      setPublishStatus(messageFrom(publishError));
    } finally {
      setPublishBusy(false);
    }
  }

  async function unpublishCanvasNow() {
    if (!window.confirm("Unpublish your canvas? The public link will stop working.")) return;
    setPublishBusy(true);
    setPublishStatus("");
    try {
      await unpublishCanvas();
      setPublication(null);
      setPublishStatus("Unpublished. Your public link no longer works.");
    } catch (unpublishError) {
      setPublishStatus(messageFrom(unpublishError));
    } finally {
      setPublishBusy(false);
    }
  }

  async function sendCanvasToTeam() {
    if (!window.confirm("Send your canvas share link to the re.KIN team?")) return;
    setSendState("sending");
    setError("");
    try {
      const token = await createCanvasShare(null);
      const url = `${window.location.origin}/canvas-share/${token}`;
      const response = await fetch("/api/canvas/share-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareUrl: url }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? "Could not send your canvas.");
      }
      setSendState("sent");
    } catch (sendError) {
      setError(messageFrom(sendError));
      setSendState("error");
    }
  }

  return (
    <div className={styles.workspace}>
      <input
        accept="image/*"
        aria-label="Choose a file"
        className={styles.hiddenInput}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          const target = pendingUpload;
          setPendingUpload(null);
          void handleImageSelection(file, target?.relatedEntryId ?? null, target?.personId ?? null);
          event.currentTarget.value = "";
        }}
        ref={generalImageInputRef}
        type="file"
      />

      {inlinePrompt && (
        <form
          className={styles.dropPrompt}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setInlinePrompt(null);
              setInlineValue("");
            }
          }}
          onSubmit={saveInlinePrompt}
          style={{ left: inlinePrompt.x, top: inlinePrompt.y }}
        >
          <input
            autoFocus
            maxLength={inlinePrompt.kind === "people" ? 120 : 1000}
            onChange={(event) => setInlineValue(event.target.value)}
            placeholder={
              inlinePrompt.kind === "details"
                ? "Add a detail"
                : inlinePrompt.kind === "question"
                  ? (currentQuestion?.question ?? "Answer this week's question")
                  : "Their name"
            }
            value={inlineValue}
          />
          <button type="submit">Save</button>
        </form>
      )}

      {userId && !loading && (
        <div className={styles.waterfallLayer}>
          {streamItems.map((item) => (
            <button
              className={`${styles.fallingWord} ${item.kind === "image" ? styles.fallingImage : ""} ${item.kind === "question" ? styles.fallingQuestion : ""}`.trim()}
              data-stream-id={item.id}
              key={item.id}
              onPointerDown={(event) => startDraggingItem(item, event)}
              style={{ left: item.x, top: item.y, pointerEvents: draggingStreamId === item.id ? "none" : "auto" }}
              aria-label={item.kind === "word" ? `Add ${item.label}` : item.kind === "question" ? `Answer this week's question: ${item.label}` : `Add ${item.stickerKey} image`}
              type="button"
            >
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={item.imageSrc} />
              ) : (
                item.label
              )}
            </button>
          ))}
        </div>
      )}

      {!configured ? (
        <div className={styles.notice}>Canvas sign-in is unavailable until Supabase is configured.</div>
      ) : !userId ? (
        <div className={styles.notice}>
          <p>Sign in to save a private canvas for the people in your life.</p>
          <button onClick={() => window.dispatchEvent(new Event("rekin:open-login"))} type="button">
            Log in to your canvas
          </button>
        </div>
      ) : loading ? (
        <p className={styles.notice}>Loading your canvas…</p>
      ) : (
        <>
          {error && <p className={styles.visuallyHidden} role="alert">{error}</p>}
          <div
            className={`${styles.canvasArea} ${dropTargetCanvas ? styles.canvasAreaDropTarget : ""}`.trim()}
            ref={canvasAreaRef}
            style={{ minHeight: board.contentHeight }}
          >
            {canvas.people.map((person) => {
              const position = board.personPositions.get(person.id) ?? { x: 16, y: 16 };
              const override = dragOverride?.kind === "person" && dragOverride.id === person.id ? dragOverride : null;
              const x = override?.x ?? position.x;
              const y = override?.y ?? position.y;
              const nameSize = namePreviewSize?.id === person.id ? namePreviewSize.size : person.nameSize;
              return (
                <div
                  className={`${styles.boardElement} ${streamDragging && dropTargetPerson === person.id ? styles.dropTarget : ""}`.trim()}
                  data-board-element
                  data-person-id={person.id}
                  key={person.id}
                  onPointerDown={(event) => startBoardDrag("person", person.id, x, y, event)}
                  style={{ left: x, top: y, pointerEvents: override ? "none" : undefined }}
                >
                  {editingPersonId === person.id ? (
                    <form
                      className={styles.renameForm}
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (renameValue.trim()) {
                          void perform(() => renameCanvasPerson(person.id, renameValue.trim())).then(() => {
                            setEditingPersonId(null);
                          });
                        }
                      }}
                    >
                      <input
                        aria-label="Person name"
                        maxLength={120}
                        onChange={(event) => setRenameValue(event.target.value)}
                        value={renameValue}
                      />
                      <button disabled={busy || !renameValue.trim()} type="submit">Save</button>
                    </form>
                  ) : (
                    <button
                      className={styles.personName}
                      data-board-drag-handle
                      onClick={() => {
                        if (justDraggedRef.current) return;
                        setRenameValue(person.name);
                        setEditingPersonId(person.id);
                      }}
                      type="button"
                    >
                      <AlphabetName name={person.name} size={nameSize} />
                    </button>
                  )}
                  {editingPersonId !== person.id && (
                    <button aria-label={`Resize ${person.name}`} className={styles.resizeHandle} onPointerDown={(event) => startPersonResize(person, event)} type="button" />
                  )}
                  <button aria-label={`Delete ${person.name}`} className={styles.personDelete} disabled={busy} onClick={() => { if (window.confirm(`Delete ${person.name}? Their entries will move to Unsorted.`)) { void perform(() => deleteCanvasPerson(person.id)); } }} type="button">
                    ×
                  </button>
                </div>
              );
            })}
            {[...canvas.unsorted, ...canvas.people.flatMap((person) => person.entries)].map((entry) => {
              const position = board.entryPositions.get(entry.id) ?? { x: 16, y: 16 };
              const override = dragOverride?.kind === "entry" && dragOverride.id === entry.id ? dragOverride : null;
              const x = override?.x ?? position.x;
              const y = override?.y ?? position.y;
              return (
                <div
                  className={`${styles.boardElement} ${entry.kind === "text" ? styles.boardText : ""}`.trim()}
                  data-board-element
                  data-canvas-entry-id={entry.id}
                  data-entry-id={entry.kind === "text" ? entry.id : undefined}
                  key={entry.id}
                  onPointerDown={(event) => startBoardDrag("entry", entry.id, x, y, event)}
                  style={{ left: x, top: y, pointerEvents: override ? "none" : undefined }}
                >
                  <CanvasEntryItem
                    busy={busy}
                    entry={entry}
                    onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
                    onResize={(size) => void perform(() => updateCanvasEntrySize(entry.id, size))}
                    onResizeText={(size) => void perform(() => updateCanvasEntryFontSize(entry.id, size))}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {configured && userId && !loading && (
        <footer className={styles.sendFooter} data-canvas-obstacle>
          <p>When you finish, share your canvas with us and we will get you matched with an artist.</p>
          <button disabled={busy || sendState === "sending"} onClick={() => void sendCanvasToTeam()} type="button">
            {sendState === "sent" ? "Sent ✓" : sendState === "sending" ? "Sending…" : "Send to re.KIN"}
          </button>
          {publication ? (
            <>
              <p>
                Published as “{publication.name}” —{" "}
                <a href={`/canvas-share/${publication.token}`} rel="noreferrer" target="_blank">
                  public link
                </a>
              </p>
              <button disabled={publishBusy} onClick={() => void unpublishCanvasNow()} type="button">
                Unpublish
              </button>
            </>
          ) : publishFormOpen ? (
            <form
              className={styles.publishForm}
              onSubmit={(event) => {
                event.preventDefault();
                void publishCanvasWithName();
              }}
            >
              <input
                aria-label="Name your canvas"
                autoFocus
                maxLength={120}
                onChange={(event) => setPublishName(event.target.value)}
                placeholder="Name your canvas"
                value={publishName}
              />
              <button disabled={publishBusy || !publishName.trim()} type="submit">
                Publish
              </button>
              <button
                disabled={publishBusy}
                onClick={() => {
                  setPublishFormOpen(false);
                  setPublishName("");
                  setPublishStatus("");
                }}
                type="button"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              disabled={publishBusy}
              onClick={() => {
                setPublishStatus("");
                setPublishFormOpen(true);
              }}
              type="button"
            >
              Publish your canvas
            </button>
          )}
          {publishStatus && (
            <p aria-live="polite" className={styles.publishStatus} role="status">
              {publishStatus}
            </p>
          )}
        </footer>
      )}
    </div>
  );
}

function CanvasEntryItem({
  busy,
  entry,
  onDelete,
  onResize,
  onResizeText,
}: {
  busy: boolean;
  entry: CanvasEntry;
  onDelete: () => void;
  onResize?: (size: number) => void;
  onResizeText?: (size: number) => void;
}) {
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const resizeStart = useRef<{ x: number; y: number; size: number } | null>(null);
  const imageSize = previewSize ?? entry.imageSize;
  const fontSize = previewSize ?? entry.fontSize;

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const isText = entry.kind === "text";
    if ((isText && !onResizeText) || (!isText && !onResize)) return;
    event.preventDefault();
    event.stopPropagation();
    const entryElement = event.currentTarget.closest(`.${styles.entry}`);
    const textElement = entryElement?.querySelector("p");
    const image = entryElement?.querySelector("img");
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      size: isText
        ? fontSize ?? (textElement ? Math.round(parseFloat(getComputedStyle(textElement).fontSize)) : 24)
        : imageSize ?? image?.getBoundingClientRect().height ?? 48,
    };
    const clampSize = (size: number) => {
      if (isText) return Math.round(Math.min(80, Math.max(14, size)));
      const availableWidth = document.querySelector<HTMLElement>(`.${styles.canvasArea}`)?.clientWidth ?? window.innerWidth;
      return Math.round(Math.min(availableWidth, Math.max(16, size)));
    };
    const updatePreview = (moveEvent: PointerEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      setPreviewSize(clampSize(start.size + (moveEvent.clientX - start.x + moveEvent.clientY - start.y) / 2));
    };
    const finishResize = (upEvent: PointerEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      const size = clampSize(start.size + (upEvent.clientX - start.x + upEvent.clientY - start.y) / 2);
      resizeStart.current = null;
      window.removeEventListener("pointermove", updatePreview);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
      setPreviewSize(size);
      if (isText) onResizeText?.(size);
      else onResize?.(size);
    };
    const cancelResize = () => {
      resizeStart.current = null;
      window.removeEventListener("pointermove", updatePreview);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
      setPreviewSize(null);
    };
    window.addEventListener("pointermove", updatePreview);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", cancelResize);
  }

  return (
    <article
      className={`${styles.entry} ${entry.kind === "text" ? styles.textEntry : styles.imageEntry}`}
      data-canvas-entry-id={entry.id}
      data-entry-id={entry.kind === "text" ? entry.id : undefined}
    >
      {entry.kind === "text" ? (
        <p style={fontSize == null ? undefined : { fontSize: `${fontSize}px` }}>{entry.content}</p>
      ) : (
        entry.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={entry.kind === "sticker" ? `re.KIN ${entry.content || "sticker"} sticker` : "Canvas image"}
            className={styles.entryImage}
            draggable={false}
            src={entry.imageUrl}
            style={imageSize === null ? undefined : { height: `${imageSize}px` }}
          />
        )
      )}
      {((entry.kind !== "text" && onResize) || (entry.kind === "text" && onResizeText)) && (
        <button aria-label={entry.kind === "text" ? "Resize text" : "Resize image"} className={styles.resizeHandle} onPointerDown={startResize} type="button" />
      )}
      <button aria-label="Delete entry" className={styles.deleteEntry} disabled={busy} onClick={onDelete} type="button">
        ×
      </button>
    </article>
  );
}
