"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteArrow from "@/components/site/SiteArrow";
import styles from "./page.module.css";

type Publication = {
  token: string;
  name: string;
  createdAt: string;
};

type CommunityCanvasItem = {
  id: string;
  question: string;
  createdAt: string;
};

type WaterfallItem = {
  key: string;
  kind: "canvas" | "question";
  label: string;
  href: string;
};

const ROW_HEIGHT = 40;

export default function CommunityContent() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [communityCanvases, setCommunityCanvases] = useState<CommunityCanvasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewportHeight, setViewportHeight] = useState(800);

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

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const waterfallItems: WaterfallItem[] = useMemo(
    () => [
      ...publications.map((publication) => ({
        key: `pub-${publication.token}`,
        kind: "canvas" as const,
        label: publication.name,
        href: `/canvas-share/${publication.token}`,
      })),
      ...communityCanvases.map((canvas) => ({
        key: `question-${canvas.id}`,
        kind: "question" as const,
        label: canvas.question,
        href: `/community/questions/${canvas.id}`,
      })),
    ],
    [publications, communityCanvases],
  );

  // The track holds the items repeated enough times that half of it always
  // covers the viewport; animating it from -50% to 0 falls downward and
  // loops seamlessly because both halves are identical.
  const { trackItems, durationSeconds } = useMemo(() => {
    if (waterfallItems.length === 0) return { trackItems: [], durationSeconds: 0 };
    const listHeight = waterfallItems.length * ROW_HEIGHT;
    let copies = Math.max(4, Math.ceil(viewportHeight / listHeight) * 2 + 2);
    if (copies % 2 !== 0) copies += 1;
    const items = Array.from({ length: copies }).flatMap(() => waterfallItems);
    const loopDistance = (copies / 2) * listHeight;
    return { trackItems: items, durationSeconds: Math.max(24, loopDistance / 60) };
  }, [waterfallItems, viewportHeight]);

  if (loading) return <p className={styles.status}>Loading the community…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      {trackItems.length > 0 && (
        <div aria-hidden="true" className={styles.waterfall}>
          <div
            className={styles.track}
            style={{ animationDuration: `${durationSeconds}s` }}
          >
            {trackItems.map((item, index) => (
              <Link
                className={styles.waterfallItem}
                href={item.href}
                key={`${item.key}-${index}`}
                tabIndex={-1}
              >
                <span className={styles.waterfallKind}>
                  {item.kind === "canvas" ? "published canvas" : "community canvas"}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <h1 className={styles.title}>re.KIN community</h1>
      <p className={styles.intro}>
        Published canvases from the community, and the questions we&rsquo;re
        answering together. Open one to see how someone else keeps what they
        notice about the people they love.
      </p>

      <h2 className={styles.sectionHeading}>Published canvases</h2>
      {publications.length === 0 ? (
        <p className={styles.status}>No canvases published yet.</p>
      ) : (
        <ul className={styles.list}>
          {publications.map((publication) => (
            <li key={publication.token}>
              <Link href={`/canvas-share/${publication.token}`}>
                {publication.name} <SiteArrow />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.sectionHeading}>Community canvases</h2>
      {communityCanvases.length === 0 ? (
        <p className={styles.status}>No community questions yet.</p>
      ) : (
        <ul className={styles.list}>
          {communityCanvases.map((canvas) => (
            <li key={canvas.id}>
              <Link href={`/community/questions/${canvas.id}`}>
                {canvas.question} <SiteArrow />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.note}>
        To publish your own canvas, name it from{" "}
        <Link href="/canvas">your canvas</Link>. Every week a new question
        appears in your canvas waterfall — answer it there, and your answer
        joins the community canvas for that question.
      </p>
    </>
  );
}
