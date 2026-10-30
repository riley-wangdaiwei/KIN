"use client";

import { useState } from "react";
import styles from "./story-cards.module.css";

const stories = [
  {
    artist: "Rachel Painter",
    title: "A Painting of a Shared Memory",
    year: "",
    copy:
      "Sonny wanted to give his girlfriend something that would remind her of their first date. He remembered the quiet bench where they had sat together, her favorite color, and a painting style he knew she loved. He brought these fragments to artist Rachel Painter, who transformed them into a landscape painting. A place became a memory, and a memory became a work of art.",
  },
  {
    artist: "Janelle Summerfield",
    title: "The Listener",
    year: "",
    copy:
      "Josh wanted to give his mother something she couldn’t find in a photograph: a painting of a childhood memory she had once shared with him. Artist Janelle Summerfield recreated the scene, turning a story about his mother’s childhood into an artwork that brought her back to a moment she thought she’d left behind. Sometimes, the most meaningful gift isn’t something new. It’s something you help someone remember.",
  },
  {
    artist: "Virginia Woolf",
    title: "Orlando",
    year: "1928",
    copy:
      "Virginia Woolf drew inspiration from the life, family history, and ancestral home of her close friend and lover, Vita Sackville-West, when writing Orlando. In 1928, Woolf gave Vita the original handwritten manuscript, inscribed “Vita from Virginia.” She had taken fragments of a real person’s life and transformed them into a literary world of her own. You don’t have to be Virginia Woolf to see someone in a way nobody else does; sometimes, you just need a way to turn what you know into something they can hold onto.",
  },
];

export default function StoryCards() {
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    stories.map(() => false),
  );

  function toggleCard(index: number) {
    setFlipped((current) =>
      current.map((isFlipped, cardIndex) =>
        cardIndex === index ? !isFlipped : isFlipped,
      ),
    );
  }

  return (
    <div className={styles.stack}>
      {stories.map((story, index) => (
        <button
          aria-label={`${story.artist}: ${story.title}. Flip for the gift.`}
          aria-pressed={flipped[index]}
          className={`${styles.card} ${flipped[index] ? styles.isFlipped : ""}`}
          key={story.title}
          onClick={() => toggleCard(index)}
          type="button"
        >
          <span className={styles.cardInner}>
            <span className={styles.front}>
              <span className={styles.artist}>{story.artist}</span>
              <span className={styles.title}>
                <em>“{story.title}”</em>
                {story.year && <span className={styles.year}>({story.year})</span>}
              </span>
              <span className={styles.hint}>flip for the gift</span>
            </span>
            <span className={styles.back}>
              <span className={styles.backTitle}>{story.artist}</span>
              <span className={styles.copy}>{story.copy}</span>
              <span className={styles.hint}>flip back</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
