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
  PLACEHOLDER_ARTISTS,
  PLACEHOLDER_PROFILE_STATS,
  SEED_GIFTING_STYLES,
  SUGGESTED_GIFTING_STYLES,
  buildProfileDirectory,
  profileDisplayName,
} from "@/features/profile/profile";
import AlphabetName from "@/components/canvas/AlphabetName";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  // Gifting styles live in page state only — there is no gifting-styles
  // table, so additions and removals do not persist.
  const [tags, setTags] = useState<string[]>(SEED_GIFTING_STYLES);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
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
    () => (user ? buildProfileDirectory(canvas, publication) : []),
    [user, canvas, publication],
  );

  // The active entry is derived during render: the hovered/selected entry,
  // else the first entry. No effect keeps activeId in sync — a stale id
  // simply falls back to the first entry.
  const activeEntry =
    directory.find((entry) => entry.id === activeId) ?? directory[0] ?? null;
  const displayName = profileDisplayName(user);
  const isGuest = authChecked && !user;

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.length > 40) return;
    setTags((current) =>
      current.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed],
    );
    setTagInput("");
  }

  function handleTagSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTag(tagInput);
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
          <p className={styles.workedWith}>
            {/* PLACEHOLDER — no collaboration data exists yet. */}
            Worked with {PLACEHOLDER_ARTISTS.join(", ")}
          </p>
        </div>
        <div className={styles.metaBlock}>
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
                    onClick={() =>
                      setTags((current) => current.filter((item) => item !== tag))
                    }
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
                        onClick={() => addTag(keyword)}
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
            activeId={activeEntry?.id ?? null}
            directory={directory}
            onSelect={setActiveId}
          />
        )}
      </section>
    </div>
  );
}
