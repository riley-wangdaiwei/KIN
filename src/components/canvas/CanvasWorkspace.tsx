"use client";

import type { DragEvent, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  getCanvasUser,
  loadCanvas,
  moveCanvasEntry,
  renameCanvasPerson,
  subscribeToCanvasAuth,
  updateCanvasEntrySize,
} from "@/lib/storage/canvas-adapter";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
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
  kind: "word" | "image";
  label?: string;
  imageSrc?: string;
  x: number;
  y: number;
  speed: number;
  detourUntil?: number;
  detourX?: number;
  stickerKey?: string;
};

type InlinePrompt = {
  kind: "details" | "people";
  personId: string | null;
  x: number;
  y: number;
};

type PendingUpload = {
  kind: "image" | "sticker";
  personId: string | null;
  relatedEntryId: string | null;
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function buildStreamSequence() {
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
  ] as const;

  return cycle.map((item) => ({ ...item }));
}

function getColumnX() {
  if (typeof window === "undefined") return 0;
  return Math.max(48, window.innerWidth - 100);
}

function makeStreamItem(id: number, index: number, startIndex: number, verticalOffset: number): StreamItem {
  const sequence = buildStreamSequence();
  const template = sequence[(startIndex + index) % sequence.length];

  return {
    id,
    kind: template.kind,
    label: template.kind === "word" ? template.label : undefined,
    imageSrc: template.kind === "image" ? template.imageSrc : undefined,
    stickerKey: template.kind === "image" ? template.stickerKey : undefined,
    x: getColumnX(),
    y: index * STREAM_ROW_HEIGHT - STREAM_ROW_HEIGHT + verticalOffset,
    speed: STREAM_SPEED,
  };
}

function getInitialStreamItems() {
  if (typeof window === "undefined") return { items: [] as StreamItem[], nextSequenceIndex: 0 };
  const count = Math.ceil(window.innerHeight / STREAM_ROW_HEIGHT) + 1;
  const sequenceLength = buildStreamSequence().length;
  const startIndex = Math.floor(Math.random() * sequenceLength);
  const verticalOffset = Math.random() * STREAM_ROW_HEIGHT;
  return {
    items: Array.from({ length: count }).map((_, index) => makeStreamItem(index + 1, index, startIndex, verticalOffset)),
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
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const generalImageInputRef = useRef<HTMLInputElement>(null);
  const [inlinePrompt, setInlinePrompt] = useState<InlinePrompt | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [dropTargetPerson, setDropTargetPerson] = useState<string | null>(null);
  const [dropTargetUnsorted, setDropTargetUnsorted] = useState(false);
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
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    streamRef.current = streamItems;
  }, [streamItems]);

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
    if (loading || streamRef.current.length > 0) return;

    const initial = getInitialStreamItems();
    const active = initial.items;
    nextStreamId.current = active.length + 1;
    nextSequenceIndex.current = initial.nextSequenceIndex;
    setStreamItems(active);
    streamRef.current = active;
  }, [loading, reducedMotion, userId]);

  useEffect(() => {
    if (!userId || loading || reducedMotion) return;

    let frame = 0;
    const tick = () => {
      if (draggingWordRef.current || pointerNearStream.current) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const sequence = buildStreamSequence();
      const hitAreas = [...document.querySelectorAll<HTMLElement>(
        `.${styles.unsorted}, .${styles.person}, [data-canvas-obstacle]`,
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
            label: template.kind === "word" ? template.label : undefined,
            imageSrc: template.kind === "image" ? template.imageSrc : undefined,
            stickerKey: template.kind === "image" ? template.stickerKey : undefined,
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
  }, [loading, reducedMotion, userId]);

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

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const active = draggingWordRef.current;
    if (!active) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const personElement = target?.closest<HTMLElement>("[data-person-id]");
    const unsortedElement = target?.closest<HTMLElement>(`.${styles.unsorted}`);
    const canvasElement = target?.closest<HTMLElement>(`.${styles.canvasArea}`);
    const isCanvasTarget = Boolean(personElement || unsortedElement || canvasElement);
    setStreamDragging(isCanvasTarget);
    setDropTargetPerson(personElement?.dataset.personId ?? null);
    setDropTargetUnsorted(Boolean(unsortedElement));
    setDropTargetCanvas(Boolean(canvasElement && !personElement && !unsortedElement));

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
    const isCanvasTarget = Boolean(target?.closest<HTMLElement>(`[data-person-id], .${styles.unsorted}, .${styles.canvasArea}`));

    draggingWordRef.current = null;
    setDraggingStreamId(null);
    setDropTargetPerson(null);
    setDropTargetUnsorted(false);
    setDropTargetCanvas(false);
    setStreamDragging(false);
    setStreamItems((current) => current.map((item) => item.id === active.id
      ? { ...item, x: getColumnX(), y: active.y, detourX: undefined, detourUntil: undefined }
      : item));
    window.removeEventListener("pointermove", handlePointerMove);

    if (!isCanvasTarget) {
      return;
    }

    if (active.kind === "word" && (active.label === "details" || active.label === "people")) {
      setInlinePrompt({ kind: active.label, personId, x: event.clientX, y: event.clientY });
      setInlineValue("");
      return;
    }

    if (active.kind === "word" && active.label === "images") {
      setPendingUpload({ kind: "image", personId, relatedEntryId });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "stickers") {
      setPendingUpload({ kind: "sticker", personId, relatedEntryId });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "jars") {
      const frame = [0, 45, 90, 135, 180][nextJarFrame.current % 5];
      nextJarFrame.current += 1;
      void perform(() => createCanvasImageFromUrl(`/jar/frames/jar_${String(frame).padStart(3, "0")}.webp`, personId, relatedEntryId));
      return;
    }

    if (active.kind === "image") {
      void perform(async () => {
        if (!active.stickerKey) return;
        await createCanvasSticker(active.stickerKey, personId, relatedEntryId);
      });
    }
  }, [handlePointerMove, perform]);

  const startDraggingItem = useCallback((item: StreamItem, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    draggingWordRef.current = item;
    setDraggingStreamId(item.id);
    setStreamDragging(true);
    setDropTargetPerson(null);
    setDropTargetUnsorted(false);
    setDropTargetCanvas(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [handlePointerMove, handlePointerUp]);

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

  function handleDrop(event: DragEvent<HTMLElement>, personId: string | null) {
    event.preventDefault();
    event.stopPropagation();
    setDropTargetPerson(null);
    setDropTargetUnsorted(false);
    setDropTargetCanvas(false);
    setStreamDragging(false);
    const entryId = event.dataTransfer.getData("text/canvas-entry-id");
    if (!entryId) return;

    const groupEntries = personId === null
      ? canvas.unsorted
      : canvas.people.find((person) => person.id === personId)?.entries ?? [];
    const target = event.target instanceof HTMLElement ? event.target : null;
    const entriesContainer = target?.closest<HTMLElement>(`.${styles.entries}`);
    const root = event.currentTarget;
    const targetElement = target?.closest<HTMLElement>("[data-canvas-entry-id]") ?? null;
    if (targetElement?.dataset.canvasEntryId === entryId) return;
    const targetRecord = targetElement
      ? groupEntries.find((entry) => entry.id === targetElement.dataset.canvasEntryId)
      : undefined;
    const targetTopLevel = targetRecord?.relatedEntryId
      ? groupEntries.find((entry) => entry.id === targetRecord.relatedEntryId)
      : targetRecord;
    const orderedEntries = groupEntries.filter((entry) => entry.id !== entryId && entry.relatedEntryId === null);
    const targetVisual = targetRecord?.relatedEntryId
      ? targetElement?.closest<HTMLElement>(`.${styles.entryLine}`) ?? targetElement
      : targetElement;
    const targetRect = targetVisual?.getBoundingClientRect();
    const targetIsInSecondHalf = Boolean(targetRect && event.clientY >= targetRect.top + targetRect.height / 2);
    const nextTarget = targetTopLevel
      ? orderedEntries[orderedEntries.findIndex((entry) => entry.id === targetTopLevel.id) + 1]
      : undefined;
    const beforeEntryId = targetTopLevel
      ? targetIsInSecondHalf ? nextTarget?.id ?? null : targetTopLevel.id
      : entriesContainer
        ? orderedEntries.find((entry) => {
            const element = root.querySelector<HTMLElement>(`[data-canvas-entry-id="${entry.id}"]`);
            return element ? event.clientY < element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2 : false;
          })?.id ?? null
        : null;
    void perform(() => moveCanvasEntry(entryId, personId, beforeEntryId));
  }

  async function handleImageSelection(file: File | undefined, relatedEntryId: string | null, targetPersonId: string | null) {
    if (!file) return;
    if (pendingUpload?.kind === "sticker") {
      await perform(() => createCanvasStickerUpload(file, targetPersonId, relatedEntryId));
      setPendingUpload(null);
      return;
    }
    await perform(() => createCanvasImage(file, relatedEntryId, targetPersonId));
    setPendingUpload(null);
  }

  async function saveInlinePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inlinePrompt || !inlineValue.trim()) return;
    const value = inlineValue.trim();
    await perform(() =>
      inlinePrompt.kind === "details"
        ? createCanvasText(value, inlinePrompt.personId)
        : createCanvasPerson(value),
    );
    setInlinePrompt(null);
    setInlineValue("");
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

  function renderEntries(entries: CanvasEntry[]) {
    const textEntries = entries.filter((entry) => entry.kind === "text");
    const renderedIds = new Set<string>();

    return (
      <>
        {textEntries.map((entry) => {
          renderedIds.add(entry.id);
          const images = entries.filter((candidate) => candidate.relatedEntryId === entry.id);
          images.forEach((image) => renderedIds.add(image.id));

          return (
            <div className={styles.entryLine} data-entry-id={entry.id} key={entry.id}>
              <CanvasEntryItem
                busy={busy}
                entry={entry}
                onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
                onResize={(size) => void perform(() => updateCanvasEntrySize(entry.id, size))}
                onStartDrag={(event) => {
                  event.dataTransfer.setData("text/canvas-entry-id", entry.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
              />
              {images.map((image) => (
                <CanvasEntryItem
                  busy={busy}
                  entry={image}
                  key={image.id}
                  onDelete={() => void perform(() => deleteCanvasEntry(image.id))}
                  onResize={(size) => void perform(() => updateCanvasEntrySize(image.id, size))}
                  onStartDrag={(event) => {
                    event.stopPropagation();
                    event.dataTransfer.setData("text/canvas-entry-id", image.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                />
              ))}
            </div>
          );
        })}
        {entries.filter((entry) => !renderedIds.has(entry.id)).map((entry) => (
          <CanvasEntryItem
            busy={busy}
            entry={entry}
            key={entry.id}
            onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
            onResize={(size) => void perform(() => updateCanvasEntrySize(entry.id, size))}
            onStartDrag={(event) => {
              event.dataTransfer.setData("text/canvas-entry-id", entry.id);
              event.dataTransfer.effectAllowed = "move";
            }}
          />
        ))}
      </>
    );
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
            maxLength={inlinePrompt.kind === "details" ? 1000 : 120}
            onChange={(event) => setInlineValue(event.target.value)}
            placeholder={inlinePrompt.kind === "details" ? "Add a detail" : "Their name"}
            value={inlineValue}
          />
          <button type="submit">Save</button>
        </form>
      )}

      {userId && !loading && (
        <div className={styles.waterfallLayer}>
          {streamItems.map((item) => (
            <button
              className={`${styles.fallingWord} ${item.kind === "image" ? styles.fallingImage : ""}`.trim()}
              data-stream-id={item.id}
              key={item.id}
              onPointerDown={(event) => startDraggingItem(item, event)}
              style={{ left: item.x, top: item.y, pointerEvents: draggingStreamId === item.id ? "none" : "auto" }}
              aria-label={item.kind === "word" ? `Add ${item.label}` : `Add ${item.stickerKey} image`}
              type="button"
            >
              {item.kind === "word" ? item.label : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={item.imageSrc} />
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
            onDragOver={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest(`[data-person-id], .${styles.unsorted}`)) return;
              event.preventDefault();
              setStreamDragging(true);
              setDropTargetPerson(null);
              setDropTargetUnsorted(false);
              setDropTargetCanvas(true);
            }}
            onDrop={(event) => handleDrop(event, null)}
          >
            {canvas.unsorted.length > 0 && (
              <div
                className={`${styles.unsorted} ${streamDragging && dropTargetUnsorted ? styles.dropTarget : ""}`.trim()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setStreamDragging(true);
                  setDropTargetPerson(null);
                  setDropTargetUnsorted(true);
                  setDropTargetCanvas(false);
                }}
                onDrop={(event) => handleDrop(event, null)}
              >
                <div className={styles.entries}>{renderEntries(canvas.unsorted)}</div>
              </div>
            )}

            <div className={styles.columns}>
              {canvas.people.map((person) => {
                const firstImage = person.entries.find((entry) => entry.kind !== "text" && !entry.relatedEntryId);
                const remainingEntries = firstImage ? person.entries.filter((entry) => entry.id !== firstImage.id) : person.entries;

                return (
                  <PersonBlock
                    busy={busy}
                    dropTarget={streamDragging && dropTargetPerson === person.id}
                    editing={editingPersonId === person.id}
                    key={person.id}
                    onDelete={() => {
                      if (window.confirm(`Delete ${person.name}? Their entries will move to Unsorted.`)) {
                        void perform(() => deleteCanvasPerson(person.id));
                      }
                    }}
                    onDrop={(event) => handleDrop(event, person.id)}
                    onRename={(name) => {
                      void perform(() => renameCanvasPerson(person.id, name)).then(() => {
                        setEditingPersonId(null);
                      });
                    }}
                    onDeleteEntry={(entryId) => void perform(() => deleteCanvasEntry(entryId))}
                    onResizeEntry={(entryId, size) => void perform(() => updateCanvasEntrySize(entryId, size))}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setStreamDragging(true);
                      setDropTargetPerson(person.id);
                      setDropTargetUnsorted(false);
                      setDropTargetCanvas(false);
                    }}
                    onStartRename={() => setEditingPersonId(person.id)}
                    person={person}
                    firstImage={firstImage}
                  >
                    {renderEntries(remainingEntries)}
                  </PersonBlock>
                );
              })}
            </div>
          </div>
        </>
      )}

      {configured && userId && !loading && (
        <footer className={styles.sendFooter} data-canvas-obstacle>
          <p>When you finish, share your canvas with us and we will get you matched with an artist.</p>
          <button disabled={busy || sendState === "sending"} onClick={() => void sendCanvasToTeam()} type="button">
            {sendState === "sent" ? "Sent ✓" : sendState === "sending" ? "Sending…" : "Send to re.KIN"}
          </button>
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
  onStartDrag,
}: {
  busy: boolean;
  entry: CanvasEntry;
  onDelete: () => void;
  onResize?: (size: number) => void;
  onStartDrag: (event: DragEvent<HTMLElement>) => void;
}) {
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const resizeStart = useRef<{ x: number; y: number; size: number } | null>(null);
  const imageSize = previewSize ?? entry.imageSize;

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!onResize || entry.kind === "text" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const image = event.currentTarget.closest(".entry")?.querySelector("img");
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      size: imageSize ?? image?.getBoundingClientRect().height ?? 48,
    };
    const updatePreview = (moveEvent: PointerEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      const availableWidth = document.querySelector<HTMLElement>(`.${styles.canvasArea}`)?.clientWidth ?? window.innerWidth;
      const size = Math.round(Math.min(availableWidth, Math.max(16, start.size + (moveEvent.clientX - start.x + moveEvent.clientY - start.y) / 2)));
      setPreviewSize(size);
    };
    const finishResize = (upEvent: PointerEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      const availableWidth = document.querySelector<HTMLElement>(`.${styles.canvasArea}`)?.clientWidth ?? window.innerWidth;
      const size = Math.round(Math.min(availableWidth, Math.max(16, start.size + (upEvent.clientX - start.x + upEvent.clientY - start.y) / 2)));
      resizeStart.current = null;
      window.removeEventListener("pointermove", updatePreview);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", cancelResize);
      setPreviewSize(size);
      onResize(size);
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
      draggable
      onDragStart={onStartDrag}
    >
      {entry.kind === "text" ? (
        <p>{entry.content}</p>
      ) : (
        entry.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={entry.kind === "sticker" ? `re.KIN ${entry.content || "sticker"} sticker` : "Canvas image"}
            className={styles.entryImage}
            src={entry.imageUrl}
            style={imageSize === null ? undefined : { height: `${imageSize}px` }}
          />
        )
      )}
      {entry.kind !== "text" && onResize && (
        <button aria-label="Resize image" className={styles.resizeHandle} onPointerDown={startResize} type="button" />
      )}
      <button aria-label="Delete entry" className={styles.deleteEntry} disabled={busy} onClick={onDelete} type="button">
        ×
      </button>
    </article>
  );
}

function PersonBlock({
  busy,
  children,
  dropTarget = false,
  editing,
  onDelete,
  onDrop,
  onRename,
  onDeleteEntry,
  onResizeEntry,
  onDragOver,
  onStartRename,
  person,
  firstImage,
}: {
  busy: boolean;
  children: React.ReactNode;
  dropTarget?: boolean;
  editing: boolean;
  onDelete: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onRename: (name: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onResizeEntry: (entryId: string, size: number) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onStartRename: () => void;
  person: CanvasPerson;
  firstImage?: CanvasEntry;
}) {
  const [name, setName] = useState(person.name);

  return (
    <section
      aria-label={`${person.name}’s block`}
      className={`${styles.person} ${dropTarget ? styles.dropTarget : ""}`.trim()}
      data-person-id={person.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={styles.personTitle}>
        {editing ? (
          <form
            className={styles.renameForm}
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) onRename(name.trim());
            }}
          >
            <input
              aria-label="Person name"
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <button disabled={busy || !name.trim()} type="submit">Save</button>
          </form>
        ) : (
          <button className={styles.personName} onClick={onStartRename} type="button">
            <AlphabetName name={person.name} />
          </button>
        )}
        {firstImage && (
          <CanvasEntryItem
            busy={busy}
            entry={firstImage}
            onDelete={() => onDeleteEntry(firstImage.id)}
            onResize={(size) => onResizeEntry(firstImage.id, size)}
            onStartDrag={(event) => {
              event.dataTransfer.setData("text/canvas-entry-id", firstImage.id);
              event.dataTransfer.effectAllowed = "move";
            }}
          />
        )}
        <button aria-label={`Delete ${person.name}`} className={styles.personDelete} disabled={busy} onClick={onDelete} type="button">
          ×
        </button>
      </div>
      <div className={styles.entries}>{children}</div>
    </section>
  );
}

function AlphabetName({ name }: { name: string }) {
  return (
    <h3 aria-label={name} className={styles.alphabetRow}>
      <span className={styles.visuallyHidden}>{name}</span>
      {Array.from(name).map((character, index) => {
        if (character === " ") {
          return <span aria-hidden="true" className={styles.letterSpace} key={`${index}-space`} />;
        }

        const asset = character.toLowerCase() === "," ? "comma" : character.toLowerCase();
        if (/^[a-z]$/.test(asset) || asset === "comma") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              className={styles.alphabetLetter}
              key={`${index}-${character}`}
              src={`/alphabet/${asset}.png`}
            />
          );
        }

        return <span aria-hidden="true" className={styles.fallbackLetter} key={`${index}-${character}`}>{character}</span>;
      })}
    </h3>
  );
}
