"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { GiftingCanvas } from "@/features/canvas/types";
import {
  getCanvasPublication,
  getCanvasUser,
  loadCanvas,
  subscribeToCanvasAuth,
  type CanvasPublication,
} from "@/lib/storage/canvas-adapter";
import {
  addGiftingStyle,
  createProfileCanvas,
  listGiftingStyles,
  listProfileCanvases,
  removeGiftingStyle,
  type ProfileCanvasRow,
} from "@/lib/storage/profile-adapter";
import {
  PLACEHOLDER_ARTISTS,
  PLACEHOLDER_PROFILE_STATS,
  SEED_GIFTING_STYLES,
  SUGGESTED_GIFTING_STYLES,
  buildProfileDirectory,
  profileDisplayName,
  type ProfileCanvas,
} from "@/features/profile/profile";
import AlphabetName from "@/components/canvas/AlphabetName";
import ProfileArtists from "./ProfileArtists";
import ProfileDirectory from "./ProfileDirectory";
import styles from "./profile-content.module.css";

const emptyCanvas: GiftingCanvas = { people: [], unsorted: [] };

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function openLogin() {
  window.dispatchEvent(new Event("rekin:open-login"));
}

export default function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [canvas, setCanvas] = useState<GiftingCanvas>(emptyCanvas);
  const [publication, setPublication] = useState<CanvasPublication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Gifting styles persist in user_gifting_styles. Until a load succeeds
  // (table missing, offline), the starter styles show and edits stay
  // local — the page never breaks on a missing table.
  const [tags, setTags] = useState<string[]>(SEED_GIFTING_STYLES);
  const [tagsPersisted, setTagsPersisted] = useState(false);
  const [tagError, setTagError] = useState("");
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  // Named canvases from profile_canvases; the board itself is always the
  // first directory entry and is not a row here.
  const [profileCanvases, setProfileCanvases] = useState<ProfileCanvas[]>([]);
  const [followNote, setFollowNote] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [loaded, pub] = await Promise.all([loadCanvas(), getCanvasPublication()]);
      setCanvas(loaded);
      setPublication(pub);
      setError("");
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
    // Styles + named canvases load best-effort: a missing table (migration
    // not applied yet) leaves the local fallbacks in place.
    void listGiftingStyles()
      .then((saved) => {
        setTags(saved);
        setTagsPersisted(true);
      })
      .catch(() => {
        setTags(SEED_GIFTING_STYLES);
        setTagsPersisted(false);
      });
    void listProfileCanvases()
      .then((rows: ProfileCanvasRow[]) =>
        setProfileCanvases(
          rows.map((row) => ({ id: row.id, name: row.name, personId: row.person_id })),
        ),
      )
      .catch(() => setProfileCanvases([]));
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToCanvasAuth((nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setAuthChecked(true);
      if (nextUser) void refresh();
      else {
        setCanvas(emptyCanvas);
        setPublication(null);
        setProfileCanvases([]);
        setLoading(false);
      }
    });
    void getCanvasUser()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setAuthChecked(true);
        if (currentUser) void refresh();
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setError(messageFrom(sessionError));
        setAuthChecked(true);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const directory = useMemo(
    () => (user ? buildProfileDirectory(canvas, publication, profileCanvases) : []),
    [user, canvas, publication, profileCanvases],
  );

  const displayName = profileDisplayName(user);
  const isGuest = authChecked && !user;

  async function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.length > 40) return;
    if (tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTagError("");
    if (tagsPersisted) {
      try {
        await addGiftingStyle(trimmed);
      } catch (saveError) {
        setTagError(messageFrom(saveError));
        return;
      }
    }
    setTags((current) => [...current, trimmed]);
    setTagInput("");
  }

  async function removeTag(value: string) {
    setTagError("");
    if (tagsPersisted) {
      try {
        await removeGiftingStyle(value);
      } catch (saveError) {
        setTagError(messageFrom(saveError));
        return;
      }
    }
    setTags((current) => current.filter((item) => item !== value));
  }

  function handleTagSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void addTag(tagInput);
  }

  // Adds a named canvas: if the name matches a person on the board, the
  // canvas links to them, so its preview shows their slice; otherwise it
  // is a named canvas with an empty preview for now. Throws on failure —
  // the directory shows the error.
  async function handleAddCanvas(name: string): Promise<void> {
    const person = canvas.people.find(
      (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
    );
    const row = await createProfileCanvas(name, person?.id ?? null);
    setProfileCanvases((current) => [
      ...current,
      { id: row.id, name: row.name, personId: row.person_id },
    ]);
  }

  // PLACEHOLDER — Follow does nothing yet. Following, and what it unlocks
  // (editing each other's canvases, gift suggestions, tokens for
  // connections), comes later.
  function handleFollow() {
    if (!user) {
      openLogin();
      return;
    }
    setFollowNote("Follow is coming soon.");
  }

  const suggestions = SUGGESTED_GIFTING_STYLES.filter(
    (keyword) =>
      !tags.some((tag) => tag.toLowerCase() === keyword.toLowerCase()),
  );

  return (
    <div className={styles.profile}>
      {isGuest && (
        <p className={styles.guestBanner}>
          You are viewing this profile as a guest —{" "}
          <button onClick={openLogin} type="button">
            log in
          </button>{" "}
          to see your canvases, styles and gifts.
        </p>
      )}

      <header className={styles.header}>
        <div className={styles.nameBlock}>
          <AlphabetName as="h1" className={styles.name} name={displayName} />
        </div>
        <div className={styles.metaBlock}>
          {/* The artists the user worked with live here, top-right — a
              hover ring (modeled on the homepage HoverRingMenu), not a
              line under the name. PLACEHOLDER artists until real
              collaboration data exists. */}
          {!isGuest && <ProfileArtists artists={PLACEHOLDER_ARTISTS} />}
          {/* PLACEHOLDER — fake numbers until tokens, subscription levels
              and follows are real features. */}
          <p className={styles.stats}>
            <span>Tokens {isGuest ? "—" : PLACEHOLDER_PROFILE_STATS.tokens}</span>
            <span>
              {isGuest ? "—" : PLACEHOLDER_PROFILE_STATS.subscription}
            </span>
            <span>
              Following {isGuest ? "—" : PLACEHOLDER_PROFILE_STATS.following}
            </span>
            <span>
              Followers {isGuest ? "—" : PLACEHOLDER_PROFILE_STATS.followers}
            </span>
          </p>
          <button className={styles.followButton} onClick={handleFollow} type="button">
            Follow
          </button>
          {followNote && <p className={styles.followNote}>{followNote}</p>}
        </div>
      </header>

      <section aria-labelledby="gifting-styles-title" className={styles.styles}>
        <h2 className={styles.sectionLabel} id="gifting-styles-title">
          Gifting styles
        </h2>
        {isGuest ? (
          <p className={styles.locked}>
            Log in to add the words that describe how you give.{" "}
            <button onClick={openLogin} type="button">
              Log in
            </button>
          </p>
        ) : (
          <>
            <ul className={styles.tags}>
              {tags.map((tag) => (
                <li className={styles.tag} key={tag}>
                  {tag}
                  <button
                    aria-label={`Remove ${tag}`}
                    className={styles.tagRemove}
                    onClick={() => void removeTag(tag)}
                    type="button"
                  >
                    ×
                  </button>
                </li>
              ))}
              <li>
                <button
                  aria-expanded={tagEditorOpen}
                  aria-label="Add a gifting style"
                  className={styles.tagAdd}
                  onClick={() => setTagEditorOpen((open) => !open)}
                  type="button"
                >
                  +
                </button>
              </li>
            </ul>
            {tagError && (
              <p className={styles.error} role="alert">
                {tagError}
              </p>
            )}
            {tagEditorOpen && (
              <form className={styles.tagEditor} onSubmit={handleTagSubmit}>
                <input
                  aria-label="Add a gifting style"
                  autoFocus
                  maxLength={40}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Type a keyword…"
                  value={tagInput}
                />
                <button type="submit">Add</button>
                {suggestions.length > 0 && (
                  <p className={styles.suggestions}>
                    {suggestions.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => void addTag(keyword)}
                        type="button"
                      >
                        {keyword}
                      </button>
                    ))}
                  </p>
                )}
              </form>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="canvases-title" className={styles.canvases}>
        <h2 className={styles.sectionLabel} id="canvases-title">
          Canvases
        </h2>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {isGuest ? (
          <p className={styles.locked}>
            Your canvases live here once you log in.{" "}
            <button onClick={openLogin} type="button">
              Log in to see your canvases
            </button>
          </p>
        ) : loading ? (
          <p className={styles.status}>Loading your canvases…</p>
        ) : (
          <ProfileDirectory
            directory={directory}
            onAddCanvas={handleAddCanvas}
            people={canvas.people}
          />
        )}
      </section>
    </div>
  );
}
