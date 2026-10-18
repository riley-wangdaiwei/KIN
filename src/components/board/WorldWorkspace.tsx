"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TasteTag } from "@/features/taste/types";
import type {
  BoardStickerKind,
  World,
  WorldFrame,
} from "@/features/world/types";
import { exampleFrames, exampleLabels, presetFrames } from "@/data/board-example";
import { boardStickers } from "@/data/board-stickers";
import {
  createWorld,
  moveTag,
  normalizeTasteTags,
  normalizeWorld,
  updateFrame,
  updateSticker,
} from "@/features/world/service";
import { storage } from "@/lib/storage";
import CreateGroup from "./CreateGroup";
import CreateLabel from "./CreateLabel";
import TagGroup from "./TagGroup";
import StickerTray from "./StickerTray";
import WorldCanvas from "./WorldCanvas";
import styles from "./board.module.css";

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createFrame(title: string, x: number, y: number): WorldFrame {
  return { id: makeId("frame"), title, x, y, width: 260, height: 185 };
}

function createTag(label: string, x: number, y: number): TasteTag {
  return {
    id: makeId("label"),
    label,
    x,
    y,
    groupIds: [],
    createdAt: new Date().toISOString(),
  };
}

export default function WorldWorkspace() {
  const [world, setWorld] = useState<World>(createWorld);
  const [tags, setTags] = useState<TasteTag[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const worldRef = useRef(world);
  const tagsRef = useRef(tags);

  useEffect(() => {
    try {
      const savedWorld = storage.getWorld();
      const nextWorld = normalizeWorld(savedWorld);
      const nextTags = normalizeTasteTags(storage.getTaste()?.tags);

      if (!savedWorld) storage.saveWorld(nextWorld);
      worldRef.current = nextWorld;
      tagsRef.current = nextTags;
      // Browser storage is only available after mount; this initializes the hydrated UI.
      /* eslint-disable react-hooks/set-state-in-effect */
      setWorld(nextWorld);
      setTags(nextTags);
      setIntroOpen(!storage.getBoardIntroSeen());
      setIsReady(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The board could not load from this browser.",
      );
    }
  }, []);

  function saveTags(nextTags: TasteTag[]) {
    try {
      storage.saveTaste({ tags: nextTags });
      tagsRef.current = nextTags;
      setTags(nextTags);
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your board labels could not be saved.",
      );
    }
  }

  function saveWorld(nextWorld: World) {
    try {
      storage.saveWorld(nextWorld);
      worldRef.current = nextWorld;
      setWorld(nextWorld);
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your board frames could not be saved.",
      );
    }
  }

  function finishIntro(showExample: boolean) {
    try {
      if (showExample) {
        storage.saveTaste({ tags: exampleLabels });
        const exampleWorld = {
          ...worldRef.current,
          frames: exampleFrames,
        };
        storage.saveWorld(exampleWorld);
        tagsRef.current = exampleLabels;
        worldRef.current = exampleWorld;
        setTags(exampleLabels);
        setWorld(exampleWorld);
      }

      storage.saveBoardIntroSeen(true);
      setIntroOpen(false);
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your board preferences could not be saved.",
      );
    }
  }

  function addFrame(title: string, x?: number, y?: number) {
    const offset = worldRef.current.frames.length % 4;
    const frame = createFrame(title, x ?? 28 + offset * 34, y ?? 36 + offset * 34);
    const nextWorld = {
      ...worldRef.current,
      frames: [...worldRef.current.frames, frame],
    };
    saveWorld(nextWorld);
  }

  function addGroupAndFrame(title: string) {
    const frame = createFrame(title, 28, 36);
    const group = {
      id: makeId("group"),
      title,
      tagIds: [],
      createdAt: new Date().toISOString(),
    };
    saveWorld({
      ...worldRef.current,
      groups: [...worldRef.current.groups, group],
      frames: [...worldRef.current.frames, frame],
    });
  }

  function addLabel(label: string, x?: number, y?: number) {
    if (tagsRef.current.some((tag) => tag.label.toLowerCase() === label.toLowerCase())) {
      return;
    }

    const index = tagsRef.current.length;
    const tag = createTag(label, x ?? 30 + (index % 3) * 75, y ?? 90 + index * 18);
    saveTags([...tagsRef.current, tag]);
  }

  function addSticker(kind: BoardStickerKind, title: string, x: number, y: number) {
    const sticker = { id: makeId("sticker"), kind, title, x, y };
    saveWorld({
      ...worldRef.current,
      stickers: [...worldRef.current.stickers, sticker],
    });
  }

  function deleteFrame(id: string) {
    saveWorld({
      ...worldRef.current,
      frames: worldRef.current.frames.filter((frame) => frame.id !== id),
    });
  }

  function deleteSticker(id: string) {
    saveWorld({
      ...worldRef.current,
      stickers: worldRef.current.stickers.filter((sticker) => sticker.id !== id),
    });
  }

  if (!isReady && !error) {
    return (
      <main className={styles.loadingBoard} aria-label="Loading your board">
        <span className={styles.microLabel}>KIN / BOARD</span>
      </main>
    );
  }

  if (error && !isReady) {
    return (
      <main className={styles.loadingBoard}>
        <p className={styles.errorMessage} role="alert">{error}</p>
        <button className={styles.smallAction} onClick={() => window.location.reload()}>
          Reload board
        </button>
      </main>
    );
  }

  const visibleTags = introOpen ? exampleLabels : tags;
  const visibleFrames = introOpen ? exampleFrames : world.frames;

  return (
    <main className={styles.boardApp}>
      <header className={styles.siteHeader}>
        <Link className={styles.wordmark} href="/" aria-label="KIN home">KIN</Link>
        <span className={styles.headerCaption}>A SMALL ARCHIVE OF WHAT MATTERS</span>
        <span className={styles.headerIssue}>BOARD / 001</span>
      </header>

      <section className={styles.boardIntro}>
        <div>
          <span className={styles.microLabel}>Collect / curate / create / give</span>
          <h1>Your little collection of things that matter.</h1>
        </div>
        <p>Drop in a word, a memory, a link, or a sentence. Sort it later, or never.</p>
      </section>

      {error && <p className={styles.errorBanner} role="alert">{error}</p>}

      <div className={styles.workspace}>
        <div className={styles.canvasColumn}>
          <WorldCanvas
            tags={visibleTags}
            frames={visibleFrames}
            stickers={introOpen ? [] : world.stickers}
            demoPreview={introOpen}
            dimmed={introOpen}
            onDropLabel={(label, x, y) => addLabel(label, x, y)}
            onDropFrame={(title, x, y) => addFrame(title, x, y)}
            onDropSticker={addSticker}
            onMoveLabel={(id, x, y) =>
              saveTags(moveTag(tagsRef.current, id, x, y))
            }
            onDeleteLabel={(id) =>
              saveTags(tagsRef.current.filter((tag) => tag.id !== id))
            }
            onMoveFrame={(id, x, y) =>
              saveWorld({
                ...worldRef.current,
                frames: updateFrame(worldRef.current.frames, id, { x, y }),
              })
            }
            onResizeFrame={(id, width, height) =>
              saveWorld({
                ...worldRef.current,
                frames: updateFrame(worldRef.current.frames, id, {
                  width,
                  height,
                }),
              })
            }
            onDeleteFrame={deleteFrame}
            onMoveSticker={(id, x, y) =>
              saveWorld({
                ...worldRef.current,
                stickers: updateSticker(worldRef.current.stickers, id, { x, y }),
              })
            }
            onDeleteSticker={deleteSticker}
          />
        </div>

        <aside className={styles.boardSidebar} aria-label="Board tools">
          <section className={styles.toolSection}>
            <h2 className={styles.toolHeading}>Add a thought</h2>
            <CreateLabel onCreate={(label) => addLabel(label)} />
          </section>

          <section className={styles.toolSection}>
            <h2 className={styles.toolHeading}>Frames / prompts</h2>
            <p className={styles.toolHint}>Drop a frame onto the board, or add it here.</p>
            <div className={styles.presetList}>
              {presetFrames.map((title) => (
                <TagGroup key={title} title={title} onAdd={addGroupAndFrame} />
              ))}
            </div>
            <CreateGroup onCreate={addGroupAndFrame} />
          </section>

          <StickerTray items={boardStickers} />
        </aside>
      </div>

      {introOpen && (
        <div className={styles.welcomeOverlay}>
          <section
            className={styles.welcomePanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            aria-describedby="welcome-description"
          >
            <div className={styles.welcomeMeta}>
              <span className={styles.welcomeKicker}>KIN / AN INVITATION</span>
              <span className={styles.welcomeIndex}>01 — 03</span>
            </div>
            <span className={styles.welcomeBarcode} aria-hidden="true">
              || ||| | || |||| || | |||
            </span>
            <h2 id="welcome-title">
              A gift starts with the little things you notice.
            </h2>
            <p id="welcome-description">
              Collect words, memories, inside jokes, and things that remind you
              of someone. You don&apos;t need to know what the gift will be yet.
            </p>
            <div className={styles.welcomeExamples}>
              <span>collects old tickets</span>
              <span>our midnight train</span>
              <span>loves obscure museums</span>
            </div>
            <div className={styles.welcomeFrameNotes}>
              <span>Their little quirks</span>
              <span>Places we&apos;ve been</span>
              <span>Things only we understand</span>
            </div>
            <div className={styles.welcomeRelation} aria-label="Me, them, and us">
              <span>ME</span>
              <i aria-hidden="true" />
              <span>THEM</span>
              <i aria-hidden="true" />
              <span>US</span>
            </div>
            <div className={styles.welcomeActions}>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => finishIntro(true)}
              >
                Explore example
              </button>
              <button
                className={styles.secondaryAction}
                type="button"
                onClick={() => finishIntro(false)}
              >
                Start my board
              </button>
              <button
                className={styles.skipAction}
                type="button"
                onClick={() => finishIntro(false)}
              >
                Skip
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
