"use client";

import type { DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCanvasImage,
  createCanvasImageFromUrl,
  createCanvasPerson,
  createCanvasShare,
  createCanvasSticker,
  createCanvasText,
  deleteCanvasEntry,
  deleteCanvasPerson,
  getCanvasUser,
  loadCanvas,
  moveCanvasEntry,
  renameCanvasPerson,
  subscribeToCanvasAuth,
} from "@/lib/storage/canvas-adapter";
import { storage } from "@/lib/storage";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import styles from "./canvas-workspace.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };
const waterfallWords = ["details", "people", "stickers", "images", "jars"] as const;
type WaterfallWord = (typeof waterfallWords)[number];
type FallingWord = {
  id: number;
  label: WaterfallWord;
  x: number;
  y: number;
  speed: number;
  dragging?: boolean;
};

type InlinePrompt = {
  kind: "details" | "people";
  personId: string | null;
  x: number;
  y: number;
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
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
  const [personName, setPersonName] = useState("");
  const [note, setNote] = useState("");
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const generalImageInputRef = useRef<HTMLInputElement>(null);
  const [waterfallHidden, setWaterfallHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return storage.getWaterfallHidden();
  });
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [inlinePrompt, setInlinePrompt] = useState<InlinePrompt | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [pendingImagePerson, setPendingImagePerson] = useState<string | null>(null);
  const [dropTargetPerson, setDropTargetPerson] = useState<string | null>(null);
  const nextWordId = useRef(1);
  const jarFrame = useRef(0);
  const draggingWordRef = useRef<FallingWord | null>(null);
  const wordsRef = useRef<FallingWord[]>([]);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    wordsRef.current = fallingWords;
  }, [fallingWords]);

  useEffect(() => {
    if (waterfallHidden || !userId || loading || reducedMotion) {
      wordsRef.current = [];
      return;
    }

    let frame = 0;
    let lastSpawn = 0;
    let previous = 0;

    const tick = (now: number) => {
      if (document.visibilityState !== "visible") {
        frame = requestAnimationFrame(tick);
        return;
      }

      const delta = previous ? Math.min((now - previous) / 16.67, 3) : 1;
      previous = now;

      const hitAreas = [...document.querySelectorAll<HTMLElement>(`.${styles.unsorted}, .${styles.person}, .${styles.canvasTools}`)].map((element) => element.getBoundingClientRect());
      let words = wordsRef.current.filter((word) => !draggingWordRef.current || word.id !== draggingWordRef.current.id);

      if (now - lastSpawn > 2200 && words.filter((word) => word.y < window.innerHeight + 80).length < 6) {
        const label = waterfallWords[Math.floor(Math.random() * waterfallWords.length)];
        words = [...words, {
          id: nextWordId.current++,
          label,
          x: window.innerWidth * (0.7 + Math.random() * 0.24),
          y: -30,
          speed: 1.1 + Math.random() * 0.5,
        }];
        lastSpawn = now;
      }

      words = words
        .map((word) => {
          if (draggingWordRef.current && draggingWordRef.current.id === word.id) return word;
          let x = word.x;
          const y = word.y + word.speed * delta;

          const rect = {
            left: x,
            top: y,
            right: x + 72,
            bottom: y + 24,
          };

          const deflected = hitAreas.some((area) =>
            rect.right > area.left && rect.left < area.right && rect.bottom > area.top && rect.top < area.bottom,
          );

          if (deflected) {
            const rightSide = x + 96 < window.innerWidth;
            x += rightSide ? 3 * delta : -3 * delta;
          }

          return { ...word, x, y };
        })
        .filter((word) => word.y < window.innerHeight + 40 && word.x > -100 && word.x < window.innerWidth + 100);

      wordsRef.current = words;
      setFallingWords(words);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [waterfallHidden, userId, loading, reducedMotion]);

  const toggleWaterfall = useCallback(() => {
    const nextHidden = !waterfallHidden;
    storage.saveWaterfallHidden(nextHidden);
    setWaterfallHidden(nextHidden);
    if (nextHidden) {
      wordsRef.current = [];
      setFallingWords([]);
    }
  }, [waterfallHidden]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const activeWord = draggingWordRef.current;
    if (!activeWord) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const personEl = target?.closest<HTMLElement>("[data-person-id]");
    const personId = personEl?.dataset.personId ?? "__unsorted__";
    setDropTargetPerson(personId);

    setFallingWords((current) =>
      current.map((word) =>
        word.id === activeWord.id ? { ...word, x: event.clientX + 18, y: event.clientY - 12, dragging: true } : word,
      ),
    );
  }, []);

  const stopDraggingWord = useCallback((event: PointerEvent) => {
    const activeWord = draggingWordRef.current;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDraggingWord);

    if (!activeWord) {
      setDropTargetPerson(null);
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const personEl = target?.closest<HTMLElement>("[data-person-id]");
    const personId = personEl?.dataset.personId ?? null;
    const isCanvasTarget = Boolean(target?.closest<HTMLElement>(`.${styles.unsorted}, .${styles.person}`));

    setFallingWords((current) => current.filter((word) => word.id !== activeWord.id));
    draggingWordRef.current = null;
    setDropTargetPerson(null);

    if (!isCanvasTarget) return;

    if (activeWord.label === "details" || activeWord.label === "people") {
      setInlinePrompt({ kind: activeWord.label, personId, x: event.clientX, y: event.clientY });
      setInlineValue("");
      return;
    }

    if (activeWord.label === "images") {
      setPendingImagePerson(personId);
      generalImageInputRef.current?.click();
      return;
    }

    if (activeWord.label === "stickers") {
      void perform(async () => {
        await createCanvasSticker();
        if (personId) {
          const loaded = await loadCanvas();
          const newest = [...loaded.unsorted, ...loaded.people.flatMap((item) => item.entries)].at(-1);
          if (newest) await moveCanvasEntry(newest.id, personId);
        }
      });
      return;
    }

    const frame = [0, 45, 90, 135, 180][jarFrame.current++ % 5];
    void perform(() => createCanvasImageFromUrl(`/jar/frames/jar_${String(frame).padStart(3, "0")}.webp`, personId));
  }, [handlePointerMove]);

  const startDraggingWord = useCallback((word: FallingWord, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    draggingWordRef.current = word;
    setFallingWords((current) =>
      current.map((item) => (item.id === word.id ? { ...item, dragging: true } : item)),
    );
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDraggingWord);
  }, [handlePointerMove, stopDraggingWord]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFallingWords([]);
    try {
      setCanvas(await loadCanvas());
      setError("");
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

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
        setFallingWords([]);
        setLoading(false);
      }
    });

    void getCanvasUser()
      .then((user) => {
        if (!active) return;
        setUserId(user?.id ?? null);
        if (user) void refresh();
        else {
          setFallingWords([]);
          setLoading(false);
        }
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

  async function perform(action: () => Promise<void>) {
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
  }

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = personName.trim();
    if (!name) return;
    await perform(() => createCanvasPerson(name));
    setPersonName("");
  }

  async function addText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = note.trim();
    if (!content) return;
    await perform(() => createCanvasText(content));
    setNote("");
  }

  function getDropPerson(event: DragEvent<HTMLElement>): string | null {
    const value = event.dataTransfer.getData("text/canvas-entry-id");
    return value || null;
  }

  function handleDrop(event: DragEvent<HTMLElement>, personId: string | null) {
    event.preventDefault();
    const entryId = getDropPerson(event);
    if (!entryId) return;
    void perform(() => moveCanvasEntry(entryId, personId));
  }

  async function handleImage(
    file: File | undefined,
    relatedEntryId: string | null,
    targetPersonId: string | null = null,
  ) {
    if (!file) return;
    await perform(() => createCanvasImage(file, relatedEntryId, targetPersonId));
  }

  async function saveInlinePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inlinePrompt || !inlineValue.trim()) return;

    const value = inlineValue.trim();
    const prompt = inlinePrompt;
    await perform(() =>
      prompt.kind === "details"
        ? createCanvasText(value, prompt.personId)
        : createCanvasPerson(value),
    );
    setInlinePrompt(null);
    setInlineValue("");
  }

  async function share(personId: string | null) {
    setBusy(true);
    setError("");
    try {
      const token = await createCanvasShare(personId);
      const key = personId ?? "canvas";
      const url = `${window.location.origin}/canvas-share/${token}`;
      setShareLinks((current) => ({ ...current, [key]: url }));
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        setError("The share link is ready below; copying it automatically was blocked.");
      }
    } catch (shareError) {
      setError(messageFrom(shareError));
    } finally {
      setBusy(false);
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

  function renderEntries(entries: CanvasEntry[]) {
    const textEntries = entries.filter((entry) => entry.kind === "text");
    const renderedIds = new Set<string>();

    return (
      <>
        {textEntries.map((entry) => {
          renderedIds.add(entry.id);
          const images = entries.filter(
            (candidate) => candidate.relatedEntryId === entry.id,
          );
          images.forEach((image) => renderedIds.add(image.id));
          return (
            <div className={styles.entryLine} key={entry.id}>
              <CanvasEntryItem
                busy={busy}
                entry={entry}
                onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
                onMove={(target) => void perform(() => moveCanvasEntry(entry.id, target))}
                onStartDrag={(event) => {
                  event.dataTransfer.setData("text/canvas-entry-id", entry.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                people={canvas.people}
              />
              {images.map((image) => (
                <CanvasEntryItem
                  busy={busy}
                  entry={image}
                  key={image.id}
                  onDelete={() => void perform(() => deleteCanvasEntry(image.id))}
                  onMove={(target) => void perform(() => moveCanvasEntry(image.id, target))}
                  onStartDrag={(event) => {
                    event.stopPropagation();
                    event.dataTransfer.setData("text/canvas-entry-id", image.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  people={canvas.people}
                />
              ))}
              <button
                aria-label={`Attach an image to ${entry.content.slice(0, 40)}`}
                className={styles.attachImage}
                disabled={busy}
                onClick={() => imageInputRefs.current[entry.id]?.click()}
                type="button"
              >
                + image
              </button>
              <input
                accept="image/*"
                aria-label="Choose an image"
                className={styles.hiddenInput}
                onChange={(event) => {
                  void handleImage(event.currentTarget.files?.[0], entry.id);
                  event.currentTarget.value = "";
                }}
                ref={(element) => { imageInputRefs.current[entry.id] = element; }}
                type="file"
              />
            </div>
          );
        })}
        {entries
          .filter((entry) => !renderedIds.has(entry.id))
          .map((entry) => (
            <CanvasEntryItem
              busy={busy}
              entry={entry}
              key={entry.id}
              onDelete={() => void perform(() => deleteCanvasEntry(entry.id))}
              onMove={(target) => void perform(() => moveCanvasEntry(entry.id, target))}
              onStartDrag={(event) => {
                event.dataTransfer.setData("text/canvas-entry-id", entry.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              people={canvas.people}
            />
          ))}
      </>
    );
  }

  const people = canvas.people;

  return (
    <div className={styles.workspace}>
      {userId && !loading && (
      <section className={styles.canvasTools} aria-label="Add to your canvas">
        <form className={styles.addPerson} onSubmit={addPerson}>
          <label htmlFor="canvas-person-name">Add a person</label>
          <div className={styles.inlineForm}>
            <input
              id="canvas-person-name"
              maxLength={120}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Their name"
              required
              value={personName}
            />
            <button disabled={busy || !personName.trim()} type="submit">Add</button>
          </div>
        </form>

        <form className={styles.addNote} onSubmit={addText}>
          <label htmlFor="canvas-note">Add a detail</label>
          <div className={styles.inlineForm}>
            <textarea
              id="canvas-note"
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Something you want to remember"
              required
              rows={2}
              value={note}
            />
            <button disabled={busy || !note.trim()} type="submit">Add note</button>
          </div>
        </form>

        <div className={styles.addMedia}>
          <input
            accept="image/*"
            aria-label="Choose an image for your canvas"
            className={styles.hiddenInput}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const targetPersonId = pendingImagePerson;
              setPendingImagePerson(null);
              void handleImage(file, null, targetPersonId);
              event.currentTarget.value = "";
            }}
            ref={generalImageInputRef}
            type="file"
          />
          <button
            disabled={busy}
            onClick={() => generalImageInputRef.current?.click()}
            type="button"
          >
            Add image to Unsorted
          </button>
          <button disabled={busy} onClick={() => void perform(createCanvasSticker)} type="button">
            Add re.KIN pot sticker
          </button>
          <button className={styles.waterfallToggle} disabled={busy} onClick={toggleWaterfall} type="button">
            {waterfallHidden ? "show waterfall" : "hide waterfall"}
          </button>
        </div>
      </section>
      )}

      <p aria-live="polite" className={styles.status} role={error ? "alert" : "status"}>
        {error}
      </p>

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

      {userId && !loading && !waterfallHidden && !reducedMotion && (
        <div aria-hidden="true" className={styles.waterfallLayer}>
          {fallingWords.map((word) => (
            <button
              className={`${styles.fallingWord} ${word.dragging ? styles.draggingWord : ""}`.trim()}
              key={word.id}
              onPointerDown={(event) => startDraggingWord(word, event)}
              style={{ left: word.x, top: word.y }}
              type="button"
            >
              {word.label}
            </button>
          ))}
        </div>
      )}

      {!configured ? (
        <div className={styles.notice}>
          Canvas sign-in is unavailable until Supabase is configured.
        </div>
      ) : !userId ? (
        <div className={styles.notice}>
          <p>Sign in to save a private canvas for the people in your life.</p>
          <button
            onClick={() => window.dispatchEvent(new Event("rekin:open-login"))}
            type="button"
          >
            Log in to your canvas
          </button>
        </div>
      ) : loading ? (
        <p className={styles.notice}>Loading your canvas…</p>
      ) : (
        <div className={styles.canvasArea}>
          <div
            aria-label="Unsorted entries. Drag an entry into a person’s block."
            className={`${styles.unsorted} ${dropTargetPerson === "__unsorted__" ? styles.dropTarget : ""}`.trim()}
            data-canvas-zone="unsorted"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, null)}
          >
            <div className={styles.areaHeading}>
              <h2>Unsorted</h2>
              <button
                className={styles.shareButton}
                disabled={busy}
                onClick={() => void share(null)}
                type="button"
              >
                Share canvas
              </button>
            </div>
            <div className={styles.entries}>{renderEntries(canvas.unsorted)}</div>
            {shareLinks.canvas && (
              <a className={styles.shareLink} href={shareLinks.canvas}>
                {shareLinks.canvas}
              </a>
            )}
          </div>

          <div className={styles.columns}>
            {people.map((person) => {
              const firstImage = person.entries.find((entry) => entry.kind !== "text");
              const remainingEntries = firstImage
                ? person.entries.filter((entry) => entry.id !== firstImage.id)
                : person.entries;
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
                    onShare={() => void share(person.id)}
                    onDeleteEntry={(entryId) => void perform(() => deleteCanvasEntry(entryId))}
                    onMoveEntry={(entryId, target) => void perform(() => moveCanvasEntry(entryId, target))}
                    onStartRename={() => setEditingPersonId(person.id)}
                    person={person}
                    shareUrl={shareLinks[person.id]}
                    firstImage={firstImage}
                    people={canvas.people}
                  >
                    {renderEntries(remainingEntries)}
                  </PersonBlock>
              );
            })}
          </div>
        </div>
      )}
      {configured && userId && !loading && (
        <footer className={styles.sendFooter}>
          <p>
            When you finish, share your canvas with us and we will get you
            matched with an artist.
          </p>
          <button
            disabled={busy || sendState === "sending"}
            onClick={() => void sendCanvasToTeam()}
            type="button"
          >
            {sendState === "sent"
              ? "Sent ✓"
              : sendState === "sending"
                ? "Sending…"
                : "Send to re.KIN"}
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
  onMove,
  onStartDrag,
  people,
  inlinePersonImage = false,
}: {
  busy: boolean;
  entry: CanvasEntry;
  onDelete: () => void;
  onMove: (personId: string | null) => void;
  onStartDrag: (event: DragEvent<HTMLElement>) => void;
  people: CanvasPerson[];
  inlinePersonImage?: boolean;
}) {
  return (
    <article
      className={`${styles.entry} ${entry.kind === "text" ? styles.textEntry : styles.imageEntry} ${inlinePersonImage ? styles.personImageEntry : ""}`}
      draggable
      onDragStart={onStartDrag}
    >
      {entry.kind === "text" ? (
        <p>{entry.content}</p>
      ) : (
        entry.imageUrl && (
          // Uploaded images are private, short-lived signed URLs from Supabase.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={entry.kind === "sticker" ? "re.KIN pot sticker" : "Canvas image"}
            className={styles.entryImage}
            src={entry.imageUrl}
          />
        )
      )}
      <div className={styles.entryActions}>
        <label className={styles.moveLabel}>
          Move to
          <select
            aria-label="Move entry to a person"
            disabled={busy}
            onChange={(event) => onMove(event.target.value || null)}
            value={entry.personId ?? ""}
          >
            <option value="">Unsorted</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>
        <button aria-label="Delete entry" disabled={busy} onClick={onDelete} type="button">
          ×
        </button>
      </div>
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
  onShare,
  onDeleteEntry,
  onMoveEntry,
  onStartRename,
  person,
  firstImage,
  people,
  shareUrl,
}: {
  busy: boolean;
  children: React.ReactNode;
  dropTarget?: boolean;
  editing: boolean;
  onDelete: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onRename: (name: string) => void;
  onShare: () => void;
  onDeleteEntry: (entryId: string) => void;
  onMoveEntry: (entryId: string, target: string | null) => void;
  onStartRename: () => void;
  person: CanvasPerson;
  firstImage?: CanvasEntry;
  people: CanvasPerson[];
  shareUrl?: string;
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
          <AlphabetName name={person.name} />
        )}
        {firstImage && (
          <CanvasEntryItem
            busy={busy}
            entry={firstImage}
            onDelete={() => onDeleteEntry(firstImage.id)}
            onMove={(target) => onMoveEntry(firstImage.id, target)}
            onStartDrag={(event) => {
              event.dataTransfer.setData("text/canvas-entry-id", firstImage.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            people={people}
            inlinePersonImage
          />
        )}
        {!editing && (
          <button className={styles.smallAction} onClick={onStartRename} type="button">
            Rename
          </button>
        )}
        <button
          aria-label={`Delete ${person.name}`}
          className={styles.personDelete}
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          ×
        </button>
      </div>
      <div className={styles.entries}>{children}</div>
      <button className={styles.shareButton} disabled={busy} onClick={onShare} type="button">
        Share this block
      </button>
      {shareUrl && <a className={styles.shareLink} href={shareUrl}>{shareUrl}</a>}
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
            // Public hand-drawn letter assets have varied intrinsic widths.
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
