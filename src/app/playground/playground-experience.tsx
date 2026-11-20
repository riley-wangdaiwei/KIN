"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { artistPartnerNames, identityExamples } from "@/data/hover-lists";
import { storage } from "@/lib/storage";
import JarScroll from "@/components/site/JarScroll";
import HoverRingMenu from "@/components/site/HoverRingMenu";
import SiteArrow from "@/components/site/SiteArrow";
import styles from "./playground.module.css";

type StoryStep = {
  body?: string[];
  introduction?: string;
  conclusion?: string;
  rows?: { label: string; description: string | string[] }[];
  circles?: boolean;
};

// Hand-drawn chapter headlines. Sentence 1 ("less generic gifting") is
// retired with the old first chapter; sentences 2 and 3 head chapters 2
// and 3, referenced from the chapters array below.
const sentenceImages = [
  { src: "/rekin-sentence1-white.png", width: 2589, height: 345 },
  { src: "/rekin-sentence2-white.png", width: 3764, height: 607 },
  { src: "/rekin-sentence3-white.png", width: 4067, height: 607 },
];

const chapters: {
  title: string;
  subtitle?: string;
  headlineImage?: { src: string; width: number; height: number };
  steps: StoryStep[];
}[] = [
  {
    // The re.KIN story, in Riles's own words, verbatim. No headline image:
    // the opening paragraph leads in the editorial italic instead.
    title: "our story",
    steps: [
      {
        introduction:
          "Riley and Eika love making gifts. Riley built her mom's childhood house out of cardboard. Eika made short films for her friends. Riley turned their chat history into a poster. Eika asked a perfume artist to make a scent.",
        body: [
          "Then we saw the problem. Most people never get to work with a real artist. Gift ideas come at the last minute. Shopping is just algorithms.",
          "So we built this. Keep a canvas for the people you love. Share ideas with other gifters. Make something with a real artist, at a fair price.",
          "We document every step, because the process is part of the gift. In a world of AI, giving should stay human.",
        ],
      },
    ],
  },
  {
    title: "more oddly specific art about your favorite people",
    subtitle: "A private gift web page, with a QR code to share it any way you like.",
    headlineImage: sentenceImages[1],
    steps: [
      {
        body: [
          "Tell us who the gift is for. We match you with an artist who fits them, and you talk with that artist directly.",
        ],
      },
      {
        body: [
          "Share the stories only you know. Together you shape them into a direction, and you decide what the gift becomes.",
        ],
      },
      {
        body: [
          "Keep a canvas for each person. Her new favorite band. The way he folds receipts. Your own taste, too. When it's time to give, it's all there.",
        ],
      },
      {
        circles: true,
        rows: [
          {
            label: "Hero gift",
            description: "One custom piece made with the artist, like a poem, photo album, or small game.",
          },
          {
            label: "Fillings",
            description: "Optional extras: More digital works by the artist; A license to an existing piece, like a poem or photo; Flowers from partner florists (coming soon).",
          },
          {
            label: "README guide",
            description: "How to use the page, what you own, and how it's stored and kept online.",
          },
          {
            label: "Artist's process note",
            description: "How the artist turned what you shared about the recipient into this gift.",
          },
        ],
        conclusion: "When it's ready, you send them a private link.",
      },
    ],
  },
  {
    title: "a more personal identity for the way you give",
    headlineImage: sentenceImages[2],
    steps: [
      {
        body: [
          "Every gift you give adds to a portfolio of your own. Over time, it shows the way you give.",
        ],
      },
      {
        body: [
          "Think of it as collaborating with artists to shape your own identity: not just a personal style, but artists you keep coming back to.",
          "Keep collaborating and earn tokens — a way to stay engaged with the artists you love.",
        ],
      },
    ],
  },
];

const openingHeadline = {
  src: "/rekin-headline-white.png",
  width: 2834,
  height: 869,
  alt: "Most gifts are bought. Ours are made. From your story.",
};

const packageImages = [
  "/jars/jar_herogift.png",
  "/jars/jar_fillings.png",
  "/jars/jar_readme.png",
  "/jars/jar_processnote.png",
];

// The chapter-2 package step drives the orbit of jars around the fixed vase.
// Found by shape, not index: the "less generic gifting" steps moved into
// chapter 2 ahead of it, so its position in the steps array changed.
const packageStep = chapters[1].steps.find((step) => step.circles);
const packageRows = packageStep?.rows ?? [];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function PlaygroundExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const orbitRef = useRef<HTMLDivElement>(null);
  const endingRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(-1);
  const [showEnding, setShowEnding] = useState(false);
  const [vaseVisible, setVaseVisible] = useState(true);
  const [chapter2Reveal, setChapter2Reveal] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [returningVisitor, setReturningVisitor] = useState(false);

  useEffect(() => {
    // Browser storage is only available after mount; this initializes the hydrated UI.
    /* eslint-disable react-hooks/set-state-in-effect */
    setReturningVisitor(storage.getHomepageSeen());
    /* eslint-enable react-hooks/set-state-in-effect */
    storage.saveHomepageSeen(true);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(motion.matches);
    syncMotion();
    motion.addEventListener("change", syncMotion);

    let ticking = false;
    const update = () => {
      ticking = false;
      const node = experienceRef.current;
      if (!node) return;

      // Jar progress: 0 while the section is still entering, 1 once it has
      // been scrolled all the way through.
      const rect = node.getBoundingClientRect();
      const distance = Math.max(1, node.offsetHeight - window.innerHeight);
      setProgress(clamp01(-rect.top / distance));

      // The fixed vase only shows while the experience section is on screen.
      setVaseVisible(rect.bottom > 0 && rect.top < window.innerHeight);

      // Scroll-spy: the chapter (or ending) the viewport center is inside.
      const center = window.innerHeight / 2;
      let nextChapter = -1;
      chapterRefs.current.forEach((section, index) => {
        if (!section) return;
        const sectionRect = section.getBoundingClientRect();
        if (sectionRect.top <= center && center <= sectionRect.bottom) {
          nextChapter = index;
        }
      });
      setActiveChapter(nextChapter);

      const endingRect = endingRef.current?.getBoundingClientRect();
      setShowEnding(
        endingRect
          ? endingRect.top <= center && center <= endingRect.bottom
          : false,
      );

      // Package orbit: the jars emerge one by one as the orbit screen
      // slides into place below the chapter text, so all four are out once
      // the chapter's tail snaps the orbit screen into the viewport. The
      // reveal starts when the orbit screen's top crosses 45% of the
      // viewport and completes when it reaches the top — 0 while the text
      // screen is the resting point, so no copy shows beside the text.
      const orbit = orbitRef.current;
      if (orbit) {
        const orbitTop = orbit.getBoundingClientRect().top;
        const span = window.innerHeight * 0.45;
        setChapter2Reveal(clamp01((span - orbitTop) / span));
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      motion.removeEventListener("change", syncMotion);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    // Document-level settings for the homepage only: mandatory snap points
    // so the page always settles on one chapter, and no visible scrollbar.
    // Both are removed when this page unmounts so other routes are
    // unaffected. Mandatory snapping fights reduced-motion users (the
    // browser animates the snap), so it stays off when reduced motion is
    // preferred.
    const root = document.documentElement;
    const previousSnapType = root.style.scrollSnapType;
    const previousScrollbarWidth = root.style.scrollbarWidth;
    const style = document.createElement("style");
    style.setAttribute("data-kin-homepage", "");
    style.textContent = "html::-webkit-scrollbar{display:none}";
    document.head.appendChild(style);
    if (!reducedMotion) {
      root.style.scrollSnapType = "y mandatory";
    }
    root.style.scrollbarWidth = "none";
    return () => {
      root.style.scrollSnapType = previousSnapType;
      root.style.scrollbarWidth = previousScrollbarWidth;
      style.remove();
    };
  }, [reducedMotion]);

  const visiblePackageCount = reducedMotion
    ? packageRows.length
    : Math.ceil(chapter2Reveal * packageRows.length);

  // The scroll hint is only for the opening: it fades out once the user
  // starts scrolling (progress is 0 at the very top).
  const showHint = progress < 0.005;

  return (
    <section className={styles.experience} ref={experienceRef}>
      <div
        className={`${styles.vase} ${vaseVisible ? "" : styles.vaseHidden}`}
        aria-hidden="true"
      >
        <JarScroll progress={progress} reducedMotion={reducedMotion} />
      </div>

      <p
        className={`${styles.scrollHint} ${showHint ? "" : styles.scrollHintHidden}`}
      >
        scroll down to read on.
      </p>

      <div className={styles.opening}>
        <div className={styles.openingTitles}>
          <h1>
            <Image
              className={styles.openingHeadlineImage}
              src={openingHeadline.src}
              alt={openingHeadline.alt}
              width={openingHeadline.width}
              height={openingHeadline.height}
              priority
            />
          </h1>
        </div>
      </div>

      {chapters.map((chapter, chapterIndex) => (
        <section
          className={`${styles.chapter} ${chapterIndex === 1 ? styles.chapterPackage : ""}`}
          key={chapter.title}
          ref={(element) => {
            chapterRefs.current[chapterIndex] = element;
          }}
        >
          <div className={styles.story}>
            {chapter.headlineImage && (
              <h2>
                <Image
                  className={`${styles.headlineImage} ${styles[`headlineChapter${chapterIndex + 1}`]}`}
                  src={chapter.headlineImage.src}
                  alt={chapter.title}
                  width={chapter.headlineImage.width}
                  height={chapter.headlineImage.height}
                />
              </h2>
            )}
            {chapter.subtitle && (
              <p className={styles.chapterSubtitle}>{chapter.subtitle}</p>
            )}
            <div className={styles.storyContent}>
              {chapter.steps.map((step, stepIndex) => (
                <div className={styles.storyStep} key={stepIndex}>
                  {step.introduction && (
                    <p className={styles.introduction}>{step.introduction}</p>
                  )}
                  {step.rows && !step.circles && (
                    <dl className={styles.packageContents}>
                      {step.rows.map((row) => (
                        <div className={styles.packageItem} key={row.label}>
                          <dt>{row.label}</dt>
                          <dd>
                            {Array.isArray(row.description)
                              ? row.description.map((line) => (
                                  <span key={line}>{line}</span>
                                ))
                              : row.description}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {step.body?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {step.conclusion && <p>{step.conclusion}</p>}
                </div>
              ))}
            </div>
          </div>

          {chapterIndex === 1 && packageStep?.circles && (
            <>
              <div
                className={styles.packageOrbit}
                ref={orbitRef}
                aria-label="What comes with the gift"
              >
              {packageRows.map((row, index) => {
                const isVisible = index < visiblePackageCount;
                return (
                  <article
                    className={`${styles.orbitItem} ${styles[`orbitItem${index + 1}`]} ${isVisible ? styles.orbitItemVisible : ""}`}
                    key={row.label}
                    aria-hidden={!isVisible}
                  >
                    <Image
                      className={styles.orbitJar}
                      src={packageImages[index]}
                      alt=""
                      width={128}
                      height={128}
                    />
                    <div className={styles.orbitCopy}>
                      <h3>{row.label}</h3>
                      <p>{row.description}</p>
                    </div>
                  </article>
                );
              })}
              </div>
              {/* In-flow spacer: the orbit is absolute, so this is what makes
                  the chapter tall enough to hold both the text screen and
                  the orbit screen below it. */}
              <div aria-hidden="true" className={styles.orbitSpacer} />
            </>
          )}

          {/* Second snap resting point for this chapter: its tail. Without
              it, mandatory snapping would trap the lower content of a
              chapter taller than the viewport. On a chapter that fits, this
              lands on the same position as the chapter's start. */}
          <div aria-hidden="true" className={styles.chapterTail} />
        </section>
      ))}

      <nav
        className={`${styles.sideNav} ${activeChapter >= 1 || showEnding ? styles.visible : styles.hidden}`}
        aria-label="Explore re.KIN"
      >
        <HoverRingMenu
          href="/artists"
          items={artistPartnerNames}
          label="artists and partners"
          menuSide="left"
        />
        {(returningVisitor || activeChapter >= 2 || showEnding) && (
          <HoverRingMenu
            href="/canvas"
            items={identityExamples}
            label="A Gifting Identity"
            menuSide="left"
          />
        )}
      </nav>

      <div className={styles.endingSection} ref={endingRef}>
        <div className={styles.ending}>
          <Link href="/my-gifting-identity">
            <Image
              src="/rekin-tell-us-white.png"
              alt="Tell us who you have in mind."
              width={3334}
              height={345}
            />
            <SiteArrow className={styles.endingArrow} />
          </Link>
        </div>
      </div>
    </section>
  );
}
