"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Waterfall, { type WaterfallTemplate } from "@/components/site/Waterfall";
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
  // Short title for the waterfall (e.g. "special gifts"); null when the
  // question has none — the waterfall falls back to the full question.
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

// The hovered waterfall item's fetch target, read from its link — the same
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
  const leftHalfRef = useRef<HTMLElement>(null);
  const rightHalfRef = useRef<HTMLElement>(null);
  // Hover preview: fetched on hover, cached per canvas, never preloaded.
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef(new Map<string, PreviewData>());
  const previewKeyRef = useRef<string | null>(null);
  const previewClearTimerRef = useRef<number | null>(null);

  const clearPreview = useCallback(() => {
    previewKeyRef.current = null;
    setPreview(null);
    setPreviewLoading(false);
  }, []);

  const handleHoverItem = useCallback(
    (item: { label?: string; href?: string } | null) => {
      if (previewClearTimerRef.current !== null) {
        window.clearTimeout(previewClearTimerRef.current);
        previewClearTimerRef.current = null;
      }
      const target = item ? previewTargetFromHref(item.href, item.label) : null;
      if (!target) {
        // A short delay so moving between two falling words does not
        // flicker the preview away and back.
        previewClearTimerRef.current = window.setTimeout(clearPreview, 120);
        return;
      }
      const key =
        target.kind === "question"
          ? `question:${target.id}`
          : `publication:${target.token}`;
      previewKeyRef.current = key;
      const cached = previewCacheRef.current.get(key);
      if (cached) {
        setPreview(cached);
        setPreviewLoading(false);
        return;
      }
      setPreview(null);
      setPreviewLoading(true);
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
          previewCacheRef.current.set(key, data);
          if (previewKeyRef.current === key) {
            setPreview(data);
            setPreviewLoading(false);
          }
        })
        .catch(() => {
          if (previewKeyRef.current === key) {
            setPreview(null);
            setPreviewLoading(false);
          }
        });
    },
    [clearPreview],
  );

  useEffect(
    () => () => {
      if (previewClearTimerRef.current !== null) {
        window.clearTimeout(previewClearTimerRef.current);
      }
    },
    [],
  );

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

  // Each half runs the same flowing waterfall as the canvas: a narrow
  // column, full page height, waterfall shape. Both falls sit LEFT of
  // their kettle — the left one in a left-aligned region (left of the
  // round jar, clear of the note beside it), the right one shifted left
  // inside its right-aligned region (left of the pitcher, off the far
  // right edge). Items are links to their canvases (click, not drag).
  // The left waterfall shows each question's short title when it has one
  // ("special gifts"), falling back to the truncated full question.
  const questionTemplates: WaterfallTemplate[] = useMemo(
    () =>
      communityCanvases.map((canvas) => ({
        kind: "word" as const,
        label: canvas.shortTitle ?? canvas.question,
        href: `/community/questions/${canvas.id}`,
        truncate: true,
      })),
    [communityCanvases],
  );
  const peopleTemplates: WaterfallTemplate[] = useMemo(
    () =>
      publications.map((publication) => ({
        kind: "word" as const,
        label: publication.name,
        href: `/canvas-share/${publication.token}`,
      })),
    [publications],
  );

  if (loading) return <p className={styles.status}>Loading the community…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      <div className={styles.halves}>
        <section aria-label="Community canvases" className={styles.half} ref={leftHalfRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className={`${styles.kettle} ${styles.kettleJar}`}
            data-canvas-obstacle
            src="/jar-community-canvases.png"
          />
          {communityCanvases.length === 0 ? (
            <p className={styles.zoneStatus}>No community questions yet.</p>
          ) : (
            <Waterfall
              onHoverItem={handleHoverItem}
              refreshKey={communityCanvases.map((canvas) => canvas.id).join("|")}
              regionAlign="left"
              regionRef={leftHalfRef}
              shapeCenter={0.4}
              templates={questionTemplates}
            />
          )}
          <p className={styles.sideNote} data-canvas-obstacle>
            To publish your own canvas, name it from{" "}
            <Link href="/canvas">your canvas</Link>. Every week a new question
            appears in your canvas waterfall — answer it there, and your answer
            joins the community canvas for that question.{" "}
            <Link href="/profile">Create your own canvas</Link>.
          </p>
        </section>

        <section aria-label="People's canvases" className={styles.half} ref={rightHalfRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className={`${styles.kettle} ${styles.kettlePitcher}`}
            data-canvas-obstacle
            src="/pitcher-peoples-canvases.png"
          />
          {publications.length === 0 ? (
            <p className={styles.zoneStatus}>No canvases published yet.</p>
          ) : (
            <Waterfall
              onHoverItem={handleHoverItem}
              refreshKey={publications.map((publication) => publication.token).join("|")}
              regionRef={rightHalfRef}
              shapeCenter={0.55}
              templates={peopleTemplates}
            />
          )}
          <p className={styles.sideNote} data-canvas-obstacle>
            Published canvases from the community, and the questions we&rsquo;re
            answering together. Open one to see how someone else keeps what they
            notice about the people they love.
          </p>
        </section>
      </div>

      {/* Hover preview: a small rectangular page-preview thumbnail of the
          hovered canvas, centered in the gap between the two kettles.
          Hover-only — the waterfall links and their click behavior are
          unchanged, and the preview never takes the pointer (it cannot be
          clicked). On mobile the halves stack, so it sits centered on
          screen instead. */}
      {(preview || previewLoading) && (
        <div
          aria-hidden="true"
          className={styles.hoverPreview}
          data-testid="community-hover-preview"
        >
          {previewLoading && !preview ? (
            <p className={styles.hoverPreviewStatus}>Loading preview…</p>
          ) : preview ? (
            <>
              <CanvasPreview
                label={preview.label}
                people={preview.people}
                unsorted={preview.unsorted}
              />
              <p className={styles.hoverPreviewCaption}>{preview.label}</p>
            </>
          ) : null}
        </div>
      )}

      {/* The falling text is a browsing surface; this list is the same
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
