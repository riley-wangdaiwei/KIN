"use client";

import type { DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCanvasImage,
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
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { CanvasEntry, CanvasPerson, GiftingCanvas } from "@/features/canvas/types";
import { groupPeopleIntoColumns } from "@/features/canvas/types";
import styles from "./canvas-workspace.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };

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
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const generalImageInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImage(file: File | undefined, relatedEntryId: string | null) {
    if (!file) return;
    await perform(() => createCanvasImage(file, relatedEntryId));
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

  const columns = groupPeopleIntoColumns(canvas.people);

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
              void handleImage(event.currentTarget.files?.[0], null);
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
        </div>
      </section>
      )}

      <p aria-live="polite" className={styles.status} role={error ? "alert" : "status"}>
        {error}
      </p>

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
            className={styles.unsorted}
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
            {columns.map((column, columnIndex) => (
              <div
                aria-label={`Canvas column ${columnIndex + 1}`}
                className={styles.column}
                key={columnIndex}
              >
                {column.map((person) => (
                  <PersonBlock
                    busy={busy}
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
                    onStartRename={() => setEditingPersonId(person.id)}
                    person={person}
                    shareUrl={shareLinks[person.id]}
                  >
                    {renderEntries(person.entries)}
                  </PersonBlock>
                ))}
              </div>
            ))}
          </div>
        </div>
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
}: {
  busy: boolean;
  entry: CanvasEntry;
  onDelete: () => void;
  onMove: (personId: string | null) => void;
  onStartDrag: (event: DragEvent<HTMLElement>) => void;
  people: CanvasPerson[];
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
  editing,
  onDelete,
  onDrop,
  onRename,
  onShare,
  onStartRename,
  person,
  shareUrl,
}: {
  busy: boolean;
  children: React.ReactNode;
  editing: boolean;
  onDelete: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onRename: (name: string) => void;
  onShare: () => void;
  onStartRename: () => void;
  person: CanvasPerson;
  shareUrl?: string;
}) {
  const [name, setName] = useState(person.name);

  return (
    <section
      aria-label={`${person.name}’s block`}
      className={styles.person}
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
          <h3>{person.name}</h3>
        )}
        {!editing && (
          <button className={styles.smallAction} onClick={onStartRename} type="button">
            Rename
          </button>
        )}
        <button className={styles.smallAction} disabled={busy} onClick={onDelete} type="button">
          Delete person
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
