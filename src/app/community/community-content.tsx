"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Waterfall, { type WaterfallTemplate } from "@/components/site/Waterfall";
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

export default function CommunityContent() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [communityCanvases, setCommunityCanvases] = useState<CommunityCanvasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const leftHalfRef = useRef<HTMLElement>(null);
  const rightHalfRef = useRef<HTMLElement>(null);

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
  // column on the right side of the half, full page height, waterfall
  // shape. Items are links to their canvases (click, not drag).
  const questionTemplates: WaterfallTemplate[] = useMemo(
    () =>
      communityCanvases.map((canvas) => ({
        kind: "word" as const,
        label: canvas.question,
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
              refreshKey={communityCanvases.map((canvas) => canvas.id).join("|")}
              regionRef={leftHalfRef}
              templates={questionTemplates}
            />
          )}
          <p className={styles.sideNote} data-canvas-obstacle>
            To publish your own canvas, name it from{" "}
            <Link href="/canvas">your canvas</Link>. Every week a new question
            appears in your canvas waterfall — answer it there, and your answer
            joins the community canvas for that question.
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
              refreshKey={publications.map((publication) => publication.token).join("|")}
              regionRef={rightHalfRef}
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
