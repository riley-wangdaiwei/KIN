"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CoverColumn, { type CoverColumnItem } from "@/components/site/CoverColumn";
import KettleNote from "@/components/site/KettleNote";
import CanvasPreview from "@/components/canvas/CanvasPreview";
import type {
  CanvasEntry,
  CanvasPerson,
  SharedCanvas,
} from "@/features/canvas/types";
import styles from "./page.module.css";

type Publication = {
  token: string;
  name: string;
  createdAt: string;
};

type CommunityCanvasItem = {
  id: string;
  question: string;
  // Short title for the column (e.g. "special gifts"); null when the
  // question has none — the column falls back to the full question.
  shortTitle: string | null;
  createdAt: string;
};

type PreviewTarget =
  | { kind: "question"; id: string; label: string }
  | { kind: "publication"; token: string; label: string };

type PreviewData = {
  key: string;
  label: string;
  people: CanvasPerson[];
  unsorted: CanvasEntry[];
};

// The preview target for a column item, read from its link — the same
// href a click would follow. Question canvases load their answers
// (/api/community/questions/[id]); published canvases load the shared
// canvas (/api/canvas/share/[token]).
function previewTargetFromHref(
  href: string | undefined,
  label: string | undefined,
): PreviewTarget | null {
  if (!href) return null;
  const questionMatch = href.match(/^\/community\/questions\/([0-9a-f-]+)$/i);
  if (questionMatch) {
    return { kind: "question", id: questionMatch[1], label: label ?? "" };
  }
  const shareMatch = href.match(/^\/canvas-share\/([0-9a-f-]+)$/i);
  if (shareMatch) {
    return { kind: "publication", token: shareMatch[1], label: label ?? "" };
  }
  return null;
}

export default function CommunityContent() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [communityCanvases, setCommunityCanvases] = useState<CommunityCanvasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // The big preview on the right: fetched on demand, cached per canvas,
  // never preloaded. The kettles never disappear for it — it lives on
  // the big screen, not at a kettle. The cache is state (not a ref) so
  // the render can read it; the effect below only starts fetches and
  // never sets state synchronously (the fetch callbacks do).
  const [previewCache, setPreviewCache] = useState<Map<string, PreviewData>>(
    () => new Map(),
  );
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Fetches in flight, so the effect never starts the same one twice
  // when it re-runs (a fetch completing re-renders, which re-runs it).
  const inflightRef = useRef(new Set<string>());
  // Which item the big preview shows: the hovered name if any, else the
  // center name of the engaged column (the last column the pointer
  // entered; the top one until then). The columns report their center
  // when it changes, so the preview follows the roll.
  const [hoveredItem, setHoveredItem] = useState<CoverColumnItem | null>(null);
  const [topCenter, setTopCenter] = useState<CoverColumnItem | null>(null);
  const [bottomCenter, setBottomCenter] = useState<CoverColumnItem | null>(null);
  const [activeColumn, setActiveColumn] = useState<"top" | "bottom">("top");

  const activeItem = useMemo(
    () =>
      hoveredItem ??
      (activeColumn === "bottom" ? bottomCenter : topCenter),
    [hoveredItem, activeColumn, bottomCenter, topCenter],
  );

  // The big preview follows the active item: the effect starts the
  // fetch for it when it is missing (cached and failed targets are
  // skipped; a fetch in flight is never started twice). State changes
  // only in the fetch's async callbacks.
  useEffect(() => {
    if (!activeItem) return;
    const target = previewTargetFromHref(activeItem.href, activeItem.label);
    if (!target) return;
    const key =
      target.kind === "question"
        ? `question:${target.id}`
        : `publication:${target.token}`;
    if (
      previewCache.has(key) ||
      failedKeys.has(key) ||
      inflightRef.current.has(key)
    ) {
      return;
    }
    inflightRef.current.add(key);
    const url =
      target.kind === "question"
        ? `/api/community/questions/${encodeURIComponent(target.id)}`
        : `/api/canvas/share/${encodeURIComponent(target.token)}`;
    void fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as
          | SharedCanvas
          | {
              answers?: { id: string; content: string; createdAt: string }[];
              error?: string;
            };
        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "This canvas could not be opened.",
          );
        }
        let data: PreviewData;
        if (target.kind === "question") {
          // A question canvas is its answers — text only, no names.
          // Rendered as unsorted text entries, so the preview shows the
          // answers stacked like the canvas page lists them.
          const answers =
            "answers" in result && Array.isArray(result.answers)
              ? result.answers
              : [];
          data = {
            key,
            label: target.label,
            people: [],
            unsorted: answers.map((answer) => ({
              id: answer.id,
              personId: null,
              relatedEntryId: null,
              kind: "text" as const,
              content: answer.content,
              storagePath: null,
              imageUrl: null,
              imageSize: null,
              fontSize: null,
              posX: null,
              posY: null,
              createdAt: answer.createdAt,
            })),
          };
        } else {
          const shared = result as SharedCanvas;
          data = {
            key,
            label: target.label,
            people: shared.people ?? [],
            unsorted: shared.unsorted ?? [],
          };
        }
        setPreviewCache((prev) => {
          const next = new Map(prev);
          next.set(key, data);
          return next;
        });
      })
      .catch(() => {
        setFailedKeys((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      })
      .finally(() => {
        inflightRef.current.delete(key);
      });
  }, [activeItem, previewCache, failedKeys]);

  useEffect(() => {
    let active = true;
    void fetch("/api/community", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          publications?: Publication[];
          communityCanvases?: CommunityCanvasItem[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "The community could not be loaded.");
        }
        if (active) {
          setPublications(result.publications ?? []);
          setCommunityCanvases(result.communityCanvases ?? []);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The community could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Each row runs a vertical column of names beside its kettle — the top
  // one the community question titles, the bottom one the people's
  // canvas names. The top column shows each question's short title when
  // it has one ("special gifts"), falling back to the full question. The
  // names are links to their canvases (click, not drag); hovering one
  // pauses its column and shows its preview on the big screen.
  const questionItems: CoverColumnItem[] = useMemo(
    () =>
      communityCanvases.map((canvas) => ({
        label: canvas.shortTitle ?? canvas.question,
        href: `/community/questions/${canvas.id}`,
      })),
    [communityCanvases],
  );
  const peopleItems: CoverColumnItem[] = useMemo(
    () =>
      publications.map((publication) => ({
        label: publication.name,
        href: `/canvas-share/${publication.token}`,
      })),
    [publications],
  );
  // What the big screen shows, derived during render: the cached data
  // for the active item (if loaded), else the in-flight preview state
  // when it already matches. No extra state — the effect above only
  // starts fetches, and a fetch completion re-renders via setPreview.
  const activeTarget = useMemo(
    () =>
      activeItem
        ? previewTargetFromHref(activeItem.href, activeItem.label)
        : null,
    [activeItem],
  );
  const activeKey = activeTarget
    ? activeTarget.kind === "question"
      ? `question:${activeTarget.id}`
      : `publication:${activeTarget.token}`
    : null;
  const shownPreview = activeKey ? (previewCache.get(activeKey) ?? null) : null;
  const activeFailed = activeKey !== null && failedKeys.has(activeKey);

  if (loading) return <p className={styles.status}>Loading the community…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      <div className={styles.layout}>
        <div className={styles.rail}>
          <section aria-label="Community canvases" className={styles.row}>
            <div className={styles.kettleWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className={styles.kettle}
                src="/jar-community-canvases.png"
              />
              <KettleNote
                kettle="jar"
                label="About the community canvases"
                side="left"
                variant="wrap"
              >
                To publish your own canvas, name it from{" "}
                <Link href="/canvas">your canvas</Link>. Every week a new question
                appears in your canvas waterfall — answer it there, and your answer
                joins the community canvas for that question.{" "}
                <Link href="/profile">Create your own canvas</Link>.
              </KettleNote>
            </div>
            {communityCanvases.length === 0 ? (
              <p className={styles.zoneStatus}>No community questions yet.</p>
            ) : (
              <CoverColumn
                items={questionItems}
                onCenterItem={setTopCenter}
                onEngage={() => setActiveColumn("top")}
                onHoverItem={setHoveredItem}
              />
            )}
          </section>

          <section aria-label="People's canvases" className={styles.row}>
            <div className={styles.kettleWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className={styles.kettle}
                src="/pitcher-peoples-canvases.png"
              />
              <KettleNote
                kettle="pitcher"
                label="About the people's canvases"
                side="left"
                variant="wrap"
              >
                Published canvases from the community, and the questions we&rsquo;re
                answering together. Open one to see how someone else keeps what they
                notice about the people they love.
              </KettleNote>
            </div>
            {publications.length === 0 ? (
              <p className={styles.zoneStatus}>No canvases published yet.</p>
            ) : (
              <CoverColumn
                items={peopleItems}
                onCenterItem={setBottomCenter}
                onEngage={() => setActiveColumn("bottom")}
                onHoverItem={setHoveredItem}
              />
            )}
          </section>
        </div>

        <section aria-label="Preview" className={styles.stage}>
          {!activeItem ? (
            <p className={styles.stageStatus}>Nothing to preview yet.</p>
          ) : activeFailed ? (
            <p className={styles.stageStatus}>This canvas could not be opened.</p>
          ) : shownPreview ? (
            <>
              <div
                aria-hidden="true"
                className={styles.stagePreview}
                data-testid="community-big-preview"
              >
                <CanvasPreview
                  label={shownPreview.label}
                  people={shownPreview.people}
                  unsorted={shownPreview.unsorted}
                />
              </div>
              <p className={styles.stageCaption}>{shownPreview.label}</p>
            </>
          ) : (
            <p className={styles.stageStatus}>Loading preview…</p>
          )}
        </section>
      </div>

      {/* The columns are a browsing surface; this list is the same
          canvases for keyboard and screen-reader access. */}
      <ul className={styles.visuallyHidden}>
        {publications.map((publication) => (
          <li key={publication.token}>
            <Link href={`/canvas-share/${publication.token}`}>{publication.name}</Link>
          </li>
        ))}
        {communityCanvases.map((canvas) => (
          <li key={canvas.id}>
            <Link href={`/community/questions/${canvas.id}`}>{canvas.question}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
