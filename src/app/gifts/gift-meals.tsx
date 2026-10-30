"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { GiftPackage } from "@/features/gifts/types";
import styles from "./gift-meals.module.css";

type GiftMeal = {
  gift: GiftPackage;
  image: string;
  title: string;
};

type GiftColumn = {
  label: string;
  meals: GiftMeal[];
};

const packageDetails: Record<string, string[]> = {
  "conversation-recap": [
    "Hero gift / a designed publication with an editorial cover, story sequence, and closing page",
    "Fillings / digital art or poem, three keepsake cards, optional partner flowers",
    "Personal message / your words as the dedication",
    "README guide / private link, keepsake PDF, and sharing instructions",
    "Artist’s process note / the visual and editorial choices behind the piece",
  ],
  "the-curiosity-cabinet": [
    "Hero gift / an illustrated digital cabinet of interests and observations",
    "Fillings / curiosity card, poem or sound note, optional partner flowers",
    "Personal message / a note about how they see the world",
    "README guide / private link, browsing, and keepsake edition",
    "Artist’s process note / how details are gathered, grouped, and illustrated",
  ],
  "two-places-one-sky": [
    "Hero gift / a paired digital map and visual story",
    "Fillings / location postcard, ambient sound, optional physical card or flowers",
    "Personal message / a note between the two places",
    "README guide / private link, map key, and downloadable keepsake",
    "Artist’s process note / place as story, not precise navigation",
  ],
  "the-photo-archive": [
    "Hero gift / a sequenced digital photo essay with captions",
    "Fillings / three caption cards, optional poem or audio, print-ready edition",
    "Personal message / a dedication or note for the first page",
    "README guide / private essay link and personal-use download",
    "Artist’s process note / sequence, omissions, captions, and image rights",
  ],
  "the-soft-landing-pack": [
    "Hero gift / an illustrated digital welcome with grounding prompts and a note",
    "Fillings / poem or sound postcard, reminder cards, optional physical gifts",
    "Personal message / a note in your own direct, quiet, or practical voice",
    "README guide / open when useful, save or print cards, share privately",
    "Artist’s process note / company and tenderness without forced optimism",
  ],
  "artist-made-rhemma-meals": [
    "Hero gift / a commission whose form and scope are set by its artist",
    "Fillings / artist-selected poems, sound, cards, licensed or physical works",
    "Personal message / included when supported by the artist’s format",
    "README guide / the artist’s scope, usage terms, and delivery instructions",
    "Artist’s process note / the choices, materials, and boundaries of the work",
  ],
  "supporting-gifts-fillings": [
    "Hero gift / a supporting work or object paired with a KIN Meal",
    "Fillings / poems, sound, cards, licensed works, or partner gifts",
    "Personal message / a short note when the filling supports it",
    "README guide / delivery details, licenses, and partner terms",
    "Artist’s process note / maker, pairing context, and usage terms",
  ],
};

export default function GiftMeals({ columns }: { columns: GiftColumn[] }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  function toggleCard(slug: string) {
    setFlipped((current) => ({ ...current, [slug]: !current[slug] }));
  }

  return (
    <div className={styles.columns}>
      {columns.map((column) => (
        <section className={styles.column} key={column.label}>
          <h2 className={styles.columnLabel}>{column.label}</h2>
          <div className={styles.mealStack}>
            {column.meals.map(({ gift, image, title }) => (
              <article
                className={`${styles.meal} ${flipped[gift.slug] ? styles.isFlipped : ""}`}
                key={gift.slug}
              >
                <div className={styles.mealInner}>
                  <button
                    aria-label={`Flip ${title} to see package contents`}
                    aria-pressed={Boolean(flipped[gift.slug])}
                    className={styles.front}
                    onClick={() => toggleCard(gift.slug)}
                    type="button"
                  >
                    <Image
                      alt=""
                      className={styles.image}
                      fill
                      priority={gift.slug === "conversation-recap"}
                      sizes="(max-width: 760px) 50vw, 50vw"
                      src={image}
                    />
                    <span className={styles.imageShade} />
                    <span className={styles.title}>{title}</span>
                    <span className={styles.flipHint}>tap to turn</span>
                  </button>
                  <div className={styles.back}>
                    <div className={styles.details}>
                      {packageDetails[gift.slug].map((detail) => (
                        <span className={styles.detailLine} key={detail}>
                          {detail}
                        </span>
                      ))}
                    </div>
                    <div className={styles.backActions}>
                      <button
                        aria-label={`Flip ${title} back`}
                        className={styles.flipBack}
                        onClick={() => toggleCard(gift.slug)}
                        type="button"
                      >
                        flip back
                      </button>
                      <Link className={styles.detailLink} href={`/gifts/${gift.slug}`}>
                        explore package →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
