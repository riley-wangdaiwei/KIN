"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GiftBrief } from "@/features/brief/types";
import { giftImagePaths, giftPackages } from "@/data/gifts";
import { storage } from "@/lib/storage";
import styles from "./gifts.module.css";

export default function GiftCatalog() {
  const [brief, setBrief] = useState<GiftBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect */
      setBrief(storage.getGiftBrief());
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      setError("Your saved gift brief could not be read from this browser.");
    }
  }, []);

  const groups = [
    { id: "conversation-recap", title: "The first KIN original", slugs: ["conversation-recap"] },
    {
      id: "kin-meals",
      title: "KIN Meals",
      slugs: [
        "the-curiosity-cabinet",
        "two-places-one-sky",
        "the-photo-archive",
        "the-soft-landing-pack",
      ],
    },
    {
      id: "artist-and-fillings",
      title: "Artists & supporting gifts",
      slugs: ["artist-made-rhemma-meals", "supporting-gifts-fillings"],
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="KIN home">
          KIN
        </Link>
        <span>GIFTS / THE CATALOG</span>
      </header>
      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>A GIFT, MADE PARTICULAR</span>
          <h1>Things made from knowing someone.</h1>
        </div>
        <p>
          Start with the details you have collected. Find a creative direction,
          then make it yours.
        </p>
      </section>

      {brief && (
        <section className={styles.briefStrip} aria-label="Your saved gift brief">
          <span className={styles.kicker}>YOUR GIFT BRIEF IS READY</span>
          <p>{brief.gift}</p>
          <Link href="/gifts/conversation-recap">
            Explore Conversation Recap →
          </Link>
        </section>
      )}
      {error && <p className={styles.catalogError} role="alert">{error}</p>}

      <div className={styles.catalog}>
        {groups.map((group) => (
          <section className={styles.catalogSection} id={group.id} key={group.id}>
            <header className={styles.sectionHeader}>
              <h2>{group.title}</h2>
              <span>{String(group.slugs.length).padStart(2, "0")} WORKS</span>
            </header>
            <div className={styles.cardGrid}>
              {group.slugs.map((slug, index) => {
                const gift = giftPackages.find((item) => item.slug === slug);
                if (!gift) return null;
                return (
                  <article
                    key={gift.slug}
                    className={`${styles.card} ${gift.category === "hero" ? styles.heroCard : ""}`}
                  >
                    <Link
                      className={styles.cardLink}
                      href={`/gifts/${gift.slug}`}
                      aria-label={`Explore ${gift.title}`}
                    >
                      <div className={styles.cardArt} aria-hidden="true">
                        <Image
                          className={styles.cardImage}
                          src={giftImagePaths[gift.slug]}
                          alt=""
                          fill
                          sizes="(max-width: 42rem) 100vw, (max-width: 58rem) 50vw, 25vw"
                        />
                        <span>{gift.heroMark}</span>
                        <b>{gift.title}</b>
                        <small>{gift.category.replace("-", " / ")}</small>
                      </div>
                      <div className={styles.cardCopy}>
                        <span className={styles.cardEyebrow}>{gift.eyebrow}</span>
                        <h3>{gift.title}</h3>
                        <p>{gift.summary}</p>
                      </div>
                    </Link>
                    <div className={styles.cardActions}>
                      <span>
                        {gift.category === "hero"
                          ? "PREORDER / PRICE CONFIRMED BEFORE PAYMENT"
                          : gift.category === "kin-meal"
                            ? "PREORDER CONCEPT"
                            : gift.category === "artist-made"
                              ? "ARTIST-LED / OPENING SOON"
                              : "OPTIONAL FILLINGS"}
                      </span>
                      <Link href={`/gifts/${gift.slug}`}>
                        {gift.category === "kin-meal"
                          ? "Preorder / details →"
                          : gift.category === "artist-made"
                            ? "Artist concept →"
                            : gift.category === "supporting-gift"
                              ? "Explore fillings →"
                              : "View the first KIN Meal →"}
                      </Link>
                    </div>
                    {index === 0 && gift.category === "hero" && (
                      <span className={styles.featuredMark}>THE HERO GIFT</span>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <footer className={styles.footer}>
        <span>KIN / GIFTS</span>
        <Link href="/">Return to your board →</Link>
      </footer>
    </main>
  );
}
