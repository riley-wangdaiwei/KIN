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
import CanvasStream, {
  type StreamDragState,
  type StreamDropItem,
  type StreamDropTarget,
} from "./CanvasStream";
import styles from "./canvas-workspace.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };

// Keep a drop prompt on screen: it is centered on the drop point, so keep
// its center at least half its size from each edge. The question prompt is
// wider and taller than the detail/name ones.
function clampPromptPoint(x: number, y: number, wide: boolean): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const halfWidth = wide ? 184 : 128;
  const halfHeight = wide ? 76 : 40;
  return {
    x: Math.max(halfWidth, Math.min(x, window.innerWidth - halfWidth)),
    y: Math.max(halfHeight, Math.min(y, window.innerHeight - halfHeight)),
  };
}

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
  const nextJarFrame = useRef(0);
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

  const board = useMemo(
    () => resolveBoardPositions(canvas.people, canvas.unsorted),
    [canvas],
  );


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

  const handleStreamDragState = useCallback((state: StreamDragState) => {
    setStreamDragging(state.dragging && state.isCanvas);
    setDropTargetPerson(state.personId);
    setDropTargetCanvas(state.isCanvas && !state.personId);
  }, []);

  // A stream word dropped on the board: the same dispatch the old stream
  // buttons ran — CanvasStream owns the drag itself now and hands over the
  // item plus the drop target it read under the pointer.
  const handleStreamDrop = useCallback((item: StreamDropItem, target: StreamDropTarget) => {
    if (!target.isCanvasTarget) return;

    const boardPoint = toBoardPoint(target.clientX, target.clientY);
    const personId = target.personId;
    const relatedEntryId = target.relatedEntryId;

    if (item.kind === "word" && (item.label === "details" || item.label === "people")) {
      setInlinePrompt({ kind: item.label, personId, x: target.clientX, y: target.clientY, boardX: boardPoint.x, boardY: boardPoint.y });
      setInlineValue("");
      return;
    }

    if (item.kind === "question") {
      setInlinePrompt({ kind: "question", personId, questionId: item.questionId, x: target.clientX, y: target.clientY, boardX: boardPoint.x, boardY: boardPoint.y });
      setInlineValue("");
      return;
    }

    if (item.kind === "word" && item.label === "images") {
      setPendingUpload({ kind: "image", personId, relatedEntryId, boardX: boardPoint.x, boardY: boardPoint.y });
      generalImageInputRef.current?.click();
      return;
    }

    if (item.kind === "word" && item.label === "stickers") {
      setPendingUpload({ kind: "sticker", personId, relatedEntryId, boardX: boardPoint.x, boardY: boardPoint.y });
      generalImageInputRef.current?.click();
      return;
    }

    if (item.kind === "word" && item.label === "jars") {
      const frame = [0, 4, 9, 14, 18][nextJarFrame.current % 5];
      nextJarFrame.current += 1;
      void perform(() => createCanvasImageFromUrl(`/jar/frames/vase_${String(frame + 1).padStart(2, "0")}.webp`, personId, relatedEntryId, boardPoint));
      return;
    }

    if (item.kind === "image") {
      void perform(async () => {
        if (!item.stickerKey) return;
        await createCanvasSticker(item.stickerKey, personId, relatedEntryId, boardPoint);
      });
    }
  }, [perform, toBoardPoint]);

  // The weekly question and the publication state ride along with the
  // session. A missing table (migration not applied yet) just means no
  // question and no publication; the publish action surfaces real errors.
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentQuestion(null);
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

  // The prompt is centered on the drop point: keep its center far enough
  // from each edge that the (wider) question prompt never clips off-screen.
  const promptPoint = inlinePrompt
    ? clampPromptPoint(inlinePrompt.x, inlinePrompt.y, inlinePrompt.kind === "question")
    : { x: 0, y: 0 };

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
          className={`${styles.dropPrompt} ${inlinePrompt.kind === "question" ? styles.dropPromptWide : ""}`.trim()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setInlinePrompt(null);
              setInlineValue("");
            }
          }}
          onSubmit={saveInlinePrompt}
          style={{ left: promptPoint.x, top: promptPoint.y }}
        >
          {/* The weekly question is a prompt: show the whole question,
              wrapped and readable, above the answer box — never as a
              truncated placeholder. */}
          {inlinePrompt.kind === "question" && (
            <>
              <p className={styles.dropPromptLabel}>prompt</p>
              <p className={styles.dropPromptQuestion}>
                {currentQuestion?.question ?? "Answer this week's question"}
              </p>
            </>
          )}
          <div className={styles.dropPromptRow}>
            <input
              autoFocus
              maxLength={inlinePrompt.kind === "people" ? 120 : 1000}
              onChange={(event) => setInlineValue(event.target.value)}
              placeholder={
                inlinePrompt.kind === "details"
                  ? "Add a detail"
                  : inlinePrompt.kind === "question"
                    ? "Write your answer…"
                    : "Their name"
              }
              value={inlineValue}
            />
            <button type="submit">Save</button>
          </div>
        </form>
      )}

      {userId && !loading && (
        <CanvasStream
          onDragState={handleStreamDragState}
          onDropItem={handleStreamDrop}
          question={currentQuestion}
        />
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
            data-canvas-area
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
