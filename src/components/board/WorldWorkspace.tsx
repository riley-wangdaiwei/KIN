"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TasteTag } from "@/features/taste/types";
import type { GiftBrief } from "@/features/brief/types";
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
import GiftCurationFlow from "./GiftCurationFlow";
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
  const router = useRouter();
  const [world, setWorld] = useState<World>(createWorld);
  const [tags, setTags] = useState<TasteTag[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [curationOpen, setCurationOpen] = useState(false);
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
      // TEMP: popup shows on every visit for design review — restore first-visit-only before launch.
      setIntroOpen(true);
      setCurationOpen(
        new URLSearchParams(window.location.search).get("curate") === "1",
      );
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

  function saveTags(nextTags: TasteTag[]): boolean {
    try {
      storage.saveTaste({ tags: nextTags });
      tagsRef.current = nextTags;
      setTags(nextTags);
      setError(null);
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your board labels could not be saved.",
      );
      return false;
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

  function addLabel(label: string, x?: number, y?: number): TasteTag | null {
    const existing = tagsRef.current.find(
      (tag) => tag.label.toLowerCase() === label.toLowerCase(),
    );
    if (existing) {
      return existing;
    }

    const index = tagsRef.current.length;
    const tag = createTag(label, x ?? 30 + (index % 3) * 75, y ?? 90 + index * 18);
    return saveTags([...tagsRef.current, tag]) ? tag : null;
  }

  function persistBrief(
    brief: GiftBrief,
    destination: "collect" | "/gifts" | "/publication",
  ) {
    try {
      storage.saveGiftBrief(brief);
      setError(null);
      if (destination === "collect") {
        setCurationOpen(false);
      } else {
        router.push(destination);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your gift brief could not be saved.",
      );
    }
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
        <div className={styles.introNote}>
          <p>Drop in a word, a memory, a link, or a sentence. Sort it later, or never.</p>
        </div>
      </section>

      {error && <p className={styles.errorBanner} role="alert">{error}</p>}

      <div className={styles.workspace} id="board">
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

      <section className={styles.storyFeature} aria-labelledby="story-feature-title">
        <header className={styles.storyFeatureHeader}>
          <span className={styles.microLabel}>KIN / STORIES OF ATTENTION</span>
          <h2 id="story-feature-title">The Art of Knowing Someone</h2>
          <span className={styles.storyFeatureIndex}>FEATURE / 001—003</span>
        </header>
        <article className={styles.storyEntry}>
          <span className={styles.storyNumber}>01.</span>
          <h3 className={styles.storyWork}>
            <span className={styles.storyArtist}>Rachel Painter</span>
            <span className={styles.storyDash}>—</span>
            <em>A Painting of a Shared Memory</em>
          </h3>
          <div className={styles.storyBody}>
            <p>
              Sonny wanted to give his girlfriend something that would remind
              her of their first date. He remembered the quiet bench where they
              had sat together, her favorite color, and a painting style he
              knew she loved. He brought these fragments to artist Rachel
              Painter, who transformed them into a landscape painting. A place
              became a memory. A memory became a work of art.
            </p>
            <Link className={styles.storyCta} href="#board">
              Start curating your own story →
            </Link>
          </div>
        </article>
        <article className={styles.storyEntry}>
          <span className={styles.storyNumber}>02.</span>
          <h3 className={styles.storyWork}>
            <span className={styles.storyArtist}>Jonelle Summerfield</span>
            <span className={styles.storyDash}>—</span>
            <em>The Listener: Reconstructing a Childhood Memory</em>
          </h3>
          <div className={styles.storyBody}>
            <p>
              Josh wanted to give his mother something she couldn&apos;t find
              in a photograph: a painting of a childhood memory she had once
              shared with him. Artist Jonelle Summerfield recreated the scene,
              turning a story about his mother&apos;s childhood into an artwork
              that brought her back to a moment she thought she&apos;d left
              behind. Sometimes, the most meaningful gift isn&apos;t something
              new. It&apos;s something you help someone remember.
            </p>
            <Link className={styles.storyCta} href="#board">
              Turn a memory into something lasting →
            </Link>
          </div>
        </article>
        <article className={styles.storyEntry}>
          <span className={styles.storyNumber}>03.</span>
          <h3 className={styles.storyWork}>
            <span className={styles.storyArtist}>Virginia Woolf</span>
            <span className={styles.storyDash}>—</span>
            <em>Orlando: A Portrait of Vita Sackville-West</em>
            <span className={styles.storyDate}>(1928)</span>
          </h3>
          <div className={styles.storyBody}>
            <p>
              Virginia Woolf drew inspiration from the life, family history,
              and ancestral home of her close friend and lover, Vita
              Sackville-West, when writing <em>Orlando</em>. In 1928, Woolf
              gave Vita the original handwritten manuscript, inscribed
              &quot;Vita from Virginia.&quot; She had taken fragments of a real
              person&apos;s life and transformed them into a literary world of
              her own. You don&apos;t have to be Virginia Woolf to see someone
              in a way nobody else does. Sometimes, you just need a way to turn
              what you know into something they can hold onto.
            </p>
            <Link className={styles.storyCta} href="/order">
              Create something only they could receive →
            </Link>
          </div>
        </article>
        <div className={styles.storyClosing}>
          <p>
            Every relationship has its own collection of stories. Start with
            yours.
          </p>
          <Link className={styles.storyBoardCta} href="#board">
            Return to the board →
          </Link>
        </div>
      </section>

      <section className={styles.continueSection} aria-labelledby="continue-title">
        <div>
          <span className={styles.microLabel}>CONTINUE / YOUR COLLECTION</span>
          <h2 id="continue-title">What will it become?</h2>
        </div>
        <div className={styles.continueActions}>
          <button
            className={styles.curationLaunch}
            type="button"
            onClick={() => setCurationOpen(true)}
          >
            Turn your curation into a gift →
          </button>
          <Link className={styles.boardOrderLink} href="/order?source=board">
            Start an order →
          </Link>
        </div>
      </section>

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
      {curationOpen && (
        <GiftCurationFlow
          tags={tags}
          frames={world.frames}
          onCreateLabel={(label) => addLabel(label)}
          onExploreGiftIdeas={(brief) => persistBrief(brief, "/gifts")}
          onMakeZine={(brief) => persistBrief(brief, "/publication")}
          onKeepCollecting={(brief) => persistBrief(brief, "collect")}
          onClose={() => setCurationOpen(false)}
        />
      )}
    </main>
  );
}
