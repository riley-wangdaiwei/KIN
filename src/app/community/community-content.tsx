"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CommunityWaterfall, {
  type CommunityWaterfallEntry,
} from "@/components/canvas/CommunityWaterfall";
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
  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);

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

  const peopleEntries: CommunityWaterfallEntry[] = useMemo(
    () =>
      publications.map((publication) => ({
        key: `pub-${publication.token}`,
        label: publication.name,
        href: `/canvas-share/${publication.token}`,
      })),
    [publications],
  );

  const communityEntries: CommunityWaterfallEntry[] = useMemo(
    () =>
      communityCanvases.map((canvas) => ({
        key: `question-${canvas.id}`,
        label: canvas.question,
        href: `/community/questions/${canvas.id}`,
      })),
    [communityCanvases],
  );

  if (loading) return <p className={styles.status}>Loading the community…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      <div className={styles.halves}>
        <section aria-label="Community canvases" className={styles.half} ref={leftHalfRef}>
          <div className={styles.streamZone} ref={leftZoneRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className={`${styles.kettle} ${styles.kettleJar}`}
              data-canvas-obstacle
              src="/jar-community-canvases.png"
            />
            {communityEntries.length > 0 ? (
              <CommunityWaterfall
                detourSide="left"
                entries={communityEntries}
                halfRef={leftHalfRef}
                zoneRef={leftZoneRef}
              />
            ) : (
              <p className={styles.zoneStatus}>No community questions yet.</p>
            )}
          </div>
          <p className={styles.sideNote} data-canvas-obstacle>
            To publish your own canvas, name it from{" "}
            <Link href="/canvas">your canvas</Link>. Every week a new question
            appears in your canvas waterfall — answer it there, and your answer
            joins the community canvas for that question.
          </p>
        </section>

        <section aria-label="People's canvases" className={styles.half} ref={rightHalfRef}>
          <div className={styles.streamZone} ref={rightZoneRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className={`${styles.kettle} ${styles.kettlePitcher}`}
              data-canvas-obstacle
              src="/pitcher-peoples-canvases.png"
            />
            {peopleEntries.length > 0 ? (
              <CommunityWaterfall
                detourSide="right"
                entries={peopleEntries}
                halfRef={rightHalfRef}
                zoneRef={rightZoneRef}
              />
            ) : (
              <p className={styles.zoneStatus}>No canvases published yet.</p>
            )}
          </div>
          <p className={styles.sideNote} data-canvas-obstacle>
            Published canvases from the community, and the questions we&rsquo;re
            answering together. Open one to see how someone else keeps what they
            notice about the people they love.
          </p>
        </section>
      </div>

      {/* The falling columns are a browsing surface; this list is the same
          canvases for keyboard and screen-reader access. */}
      <ul className={styles.visuallyHidden}>
        {peopleEntries.map((entry) => (
          <li key={entry.key}>
            <Link href={entry.href}>{entry.label}</Link>
          </li>
        ))}
        {communityEntries.map((entry) => (
          <li key={entry.key}>
            <Link href={entry.href}>{entry.label}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
