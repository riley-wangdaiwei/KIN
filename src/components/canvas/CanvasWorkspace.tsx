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
} from "@/lib/storage/canvas-adapter";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import styles from "./canvas-workspace.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };
const providedStickerKeys = ["humankind", "rekin", "love", "foto"] as const;
type StreamItem = {
  id: number;
  kind: "word" | "image";
  label?: string;
  imageSrc?: string;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
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
  const items: Array<{ kind: "word" | "image"; label?: string; imageSrc?: string }> = [];
  const stickerImages = providedStickerKeys.map((key) => ({
    kind: "image" as const,
    imageSrc: `/stickers/${key}.svg`,
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

  for (let i = 0; i < 24; i += 1) {
    const template = cycle[i % cycle.length];
    items.push({ ...template });
  }

  return items;
}

function getColumnX() {
  if (typeof window === "undefined") return 0;
  return Math.max(24, window.innerWidth - 136);
}

function makeStreamItem(id: number, index: number): StreamItem {
  const template = buildStreamSequence()[index % 24];
  const x = getColumnX() + (template.kind === "image" ? 2 : 0);
  const height = template.kind === "image" ? 44 : 28;

  return {
    id,
    kind: template.kind,
    label: template.kind === "word" ? template.label : undefined,
    imageSrc: template.kind === "image" ? template.imageSrc : undefined,
    x,
    y: index * 34,
    speed: 1.25,
    width: template.kind === "image" ? 54 : 90,
    height,
  };
}

function getInitialStreamItems() {
  if (typeof window === "undefined") return [];
  return Array.from({ length: 16 }).map((_, index) => makeStreamItem(index + 1, index));
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
  const streamRef = useRef<StreamItem[]>([]);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const draggingWordRef = useRef<StreamItem | null>(null);
  const nextStreamId = useRef(1);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    streamRef.current = streamItems;
  }, [streamItems]);

  useEffect(() => {
    if (!userId || loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreamItems([]);
      streamRef.current = [];
      return;
    }

    const initial = getInitialStreamItems();
    const active = reducedMotion ? initial : initial.map((item, index) => ({ ...item, y: index * 36 }));
    setStreamItems(active);
    streamRef.current = active;
  }, [loading, reducedMotion, userId]);

  useEffect(() => {
    if (!userId || loading || reducedMotion) return;

    let frame = 0;
    const tick = () => {
      const items = streamRef.current
        .map((item) => {
          const nextY = item.y + item.speed;
          const shifted = { ...item, y: nextY };
          const hitAreas = [...document.querySelectorAll<HTMLElement>(`.${styles.unsorted}, .${styles.person}`)]
            .map((element) => element.getBoundingClientRect());

          const wouldHit = hitAreas.some((area) => {
            const itemLeft = shifted.x;
            const itemRight = shifted.x + shifted.width;
            const itemTop = shifted.y;
            const itemBottom = shifted.y + shifted.height;
            return itemRight > area.left && itemLeft < area.right && itemBottom > area.top && itemTop < area.bottom;
          });

          if (wouldHit) {
            return { ...shifted, x: shifted.x + 14, y: shifted.y };
          }

          return shifted;
        })
        .map((item) => {
          if (item.y > window.innerHeight + 100) {
            const nextIndex = streamRef.current.length + 1;
            const template = buildStreamSequence()[nextIndex % 24];
            const columnX = getColumnX();
            return {
              ...item,
              id: nextStreamId.current++,
              kind: template.kind,
              label: template.kind === "word" ? template.label : undefined,
              imageSrc: template.kind === "image" ? template.imageSrc : undefined,
              x: columnX + (template.kind === "image" ? 2 : 0),
              y: -40,
              speed: 1.25,
              width: template.kind === "image" ? 54 : 100,
              height: template.kind === "image" ? 44 : 28,
            };
          }
          return item;
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
    setDropTargetPerson(personElement?.dataset.personId ?? null);

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
    const personElement = target?.closest<HTMLElement>("[data-person-id]");
    const personId = personElement?.dataset.personId ?? null;
    const isCanvasTarget = Boolean(target?.closest<HTMLElement>(`.${styles.unsorted}, .${styles.person}`));

    draggingWordRef.current = null;
    setDropTargetPerson(null);
    window.removeEventListener("pointermove", handlePointerMove);

    if (!isCanvasTarget) {
      setStreamItems((current) => current.filter((item) => item.id !== active.id));
      return;
    }

    if (active.kind === "word" && (active.label === "details" || active.label === "people")) {
      setInlinePrompt({ kind: active.label, personId, x: event.clientX, y: event.clientY });
      setInlineValue("");
      return;
    }

    if (active.kind === "word" && active.label === "images") {
      setPendingUpload({ kind: "image", personId, relatedEntryId: null });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "stickers") {
      setPendingUpload({ kind: "sticker", personId, relatedEntryId: null });
      generalImageInputRef.current?.click();
      return;
    }

    if (active.kind === "word" && active.label === "jars") {
      const frame = [0, 45, 90, 135, 180][(nextStreamId.current + 1) % 5];
      void perform(() => createCanvasImageFromUrl(`/jar/frames/jar_${String(frame).padStart(3, "0")}.webp`, personId));
      return;
    }

    if (active.kind === "image") {
      void perform(async () => {
        const key = (active.imageSrc ?? "/pot.jpg").replace(/^\/stickers\//, "").replace(/\.svg$/, "");
        await createCanvasSticker(key, personId);
      });
    }
  }, [handlePointerMove, perform]);

  const startDraggingItem = useCallback((item: StreamItem, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    draggingWordRef.current = item;
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
    const entryId = event.dataTransfer.getData("text/canvas-entry-id");
    if (!entryId) return;
    void perform(() => moveCanvasEntry(entryId, personId));
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
            <div className={styles.entryLine} key={entry.id}>
              <CanvasEntryItem
                busy={busy}
                entry={entry}
                onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
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

      {userId && !loading && !reducedMotion && (
        <div aria-hidden="true" className={styles.waterfallLayer}>
          {streamItems.map((item) => (
            <button
              className={`${styles.fallingWord} ${item.kind === "image" ? styles.fallingImage : ""}`.trim()}
              key={item.id}
              onPointerDown={(event) => startDraggingItem(item, event)}
              style={{ left: item.x, top: item.y }}
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
          {error && <p className={styles.status} role="alert">{error}</p>}
          <div className={styles.canvasArea}>
            <div
              aria-label="Unsorted entries"
              className={`${styles.unsorted} ${dropTargetPerson === null ? styles.dropTarget : ""}`.trim()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, null)}
            >
              <div className={styles.entries}>{renderEntries(canvas.unsorted)}</div>
            </div>

            <div className={styles.columns}>
              {canvas.people.map((person) => {
                const firstImage = person.entries.find((entry) => entry.kind !== "text");
                const remainingEntries = firstImage ? person.entries.filter((entry) => entry.id !== firstImage.id) : person.entries;

                return (
                  <PersonBlock
                    busy={busy}
                    dropTarget={dropTargetPerson === person.id}
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
        <footer className={styles.sendFooter}>
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
  onStartDrag,
}: {
  busy: boolean;
  entry: CanvasEntry;
  onDelete: () => void;
  onStartDrag: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={`${styles.entry} ${entry.kind === "text" ? styles.textEntry : styles.imageEntry}`}
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
          />
        )
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
      onDragOver={(event) => event.preventDefault()}
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
