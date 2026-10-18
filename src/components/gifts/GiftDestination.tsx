"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GiftBrief } from "@/features/brief/types";
import { storage } from "@/lib/storage";
import styles from "./gift-destination.module.css";

interface GiftDestinationProps {
  destination: "gifts" | "publication";
}

export default function GiftDestination({
  destination,
}: GiftDestinationProps) {
  const [brief, setBrief] = useState<GiftBrief | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPublication = destination === "publication";

  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect */
      setBrief(storage.getGiftBrief());
      setIsReady(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your saved gift brief could not be loaded.",
      );
    }
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="KIN home">
          KIN
        </Link>
        <span>{isPublication ? "PUBLICATION / PREVIEW" : "GIFT IDEAS / 001"}</span>
      </header>
      <section className={styles.content}>
        <span className={styles.kicker}>
          {isPublication ? "A KIN ZINE" : "FROM YOUR BOARD"}
        </span>
        <h1>{isPublication ? "A world, held in print." : "A gift, taking shape."}</h1>
        <p className={styles.intro}>
          {isPublication
            ? "A publication can gather the little details into something to return to. This is a preview of the direction, shaped by your brief."
            : "Your curation is here. Start with the brief, then explore a creative direction for a gift that feels like them."}
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!error && !isReady && <p className={styles.status}>Opening your saved brief…</p>}
        {!error && isReady && brief ? (
          <>
            <section className={styles.brief} aria-label="Your gift brief">
              <span className={styles.briefLabel}>YOUR GIFT BRIEF</span>
              <BriefPart title="Me" text={brief.me} />
              <BriefPart title="Them" text={brief.them} />
              <BriefPart title="The Gift" text={brief.gift} />
            </section>
            {isPublication ? (
              <p className={styles.previewNote}>
                Publication planning is a preview for now. Your brief is saved
                on this device, ready for the next step.
              </p>
            ) : (
              <section className={styles.idea}>
                <span className={styles.briefLabel}>A FIRST DIRECTION</span>
                <h2>Conversation Recap</h2>
                <p>
                  A personal digital publication that brings together the
                  memories, small details, and things only the two of you know.
                </p>
                <span className={styles.previewTag}>GIFT IDEA / PREVIEW</span>
              </section>
            )}
          </>
        ) : null}
        {!error && isReady && !brief && (
          <section className={styles.noBrief}>
            <p>There is no gift brief saved on this device yet.</p>
            <Link className={styles.primary} href="/">
              Return to your board →
            </Link>
          </section>
        )}
        {brief && (
          <nav className={styles.actions} aria-label="Continue exploring">
            {isPublication && (
              <Link className={styles.secondary} href="/gifts">
                Explore Gift Ideas →
              </Link>
            )}
            <Link className={styles.primary} href="/">
              Keep Collecting
            </Link>
          </nav>
        )}
      </section>
    </main>
  );
}

function BriefPart({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.briefPart}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
