"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TextFlowSection from "@/components/site/TextFlowSection";
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

  if (loading) return <p className={styles.status}>Loading the community…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      <div className={styles.halves}>
        <TextFlowSection
          ariaLabel="Community canvases"
          className={styles.half}
          refreshKey={communityCanvases.map((canvas) => canvas.id).join("|")}
          separator="·"
          shape="waterfall"
        >
          {/* The question words are links so the fall stays clickable; the
              words of one question all point at the same canvas. The source
              links are tabIndex -1 — the list below is the keyboard path. */}
          <div data-flow-source>
            {communityCanvases.map((canvas) => (
              <span key={canvas.id}>
                {canvas.question.split(/\s+/).map((word, index) => (
                  <a
                    className="name"
                    href={`/community/questions/${canvas.id}`}
                    key={`${canvas.id}-${index}`}
                    tabIndex={-1}
                  >
                    {word}
                  </a>
                ))}
              </span>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className={`${styles.kettle} ${styles.kettleJar}`}
            data-flow-obstacle
            src="/jar-community-canvases.png"
          />
          {communityCanvases.length === 0 && (
            <p className={styles.zoneStatus}>No community questions yet.</p>
          )}
          <p className={styles.sideNote} data-flow-obstacle>
            To publish your own canvas, name it from{" "}
            <Link href="/canvas">your canvas</Link>. Every week a new question
            appears in your canvas waterfall — answer it there, and your answer
            joins the community canvas for that question.
          </p>
        </TextFlowSection>

        <TextFlowSection
          ariaLabel="People's canvases"
          className={styles.half}
          refreshKey={publications.map((publication) => publication.token).join("|")}
          separator="·"
          shape="waterfall"
        >
          <div data-flow-source>
            {publications.map((publication) => (
              <span key={publication.token}>
                {publication.name.split(/\s+/).map((word, index) => (
                  <a
                    className="name"
                    href={`/canvas-share/${publication.token}`}
                    key={`${publication.token}-${index}`}
                    tabIndex={-1}
                  >
                    {word}
                  </a>
                ))}
              </span>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className={`${styles.kettle} ${styles.kettlePitcher}`}
            data-flow-obstacle
            src="/pitcher-peoples-canvases.png"
          />
          {publications.length === 0 && (
            <p className={styles.zoneStatus}>No canvases published yet.</p>
          )}
          <p className={styles.sideNote} data-flow-obstacle>
            Published canvases from the community, and the questions we&rsquo;re
            answering together. Open one to see how someone else keeps what they
            notice about the people they love.
          </p>
        </TextFlowSection>
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
