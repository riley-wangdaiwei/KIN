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

const chapters: { title: string; subtitle?: string; steps: StoryStep[] }[] = [
  {
    title: "less generic gifting",
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
    ],
  },
  {
    title: "more oddly specific art about your favorite people",
    subtitle: "A private gift web page, with a QR code to share it any way you like.",
    steps: [
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
    steps: [
      {
        body: [
          "Every gift you give adds to a portfolio of your own. Over time, it shows the way you give.",
        ],
      },
      {
        body: [
          "Think of it as collaborating with artists to shape your own identity: not just a personal style, but artists you keep coming back to.",
          "We help you refine it, and you can share it whenever you like.",
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

const sentenceImages = [
  { src: "/rekin-sentence1-white.png", width: 2589, height: 345 },
  { src: "/rekin-sentence2-white.png", width: 3764, height: 607 },
  { src: "/rekin-sentence3-white.png", width: 4067, height: 607 },
];

const packageImages = [
  "/jars/jar_herogift.png",
  "/jars/jar_fillings.png",
  "/jars/jar_readme.png",
  "/jars/jar_processnote.png",
];

// The chapter-2 package step drives the orbit of jars around the fixed vase.
const packageStep = chapters[1].steps[1];
const packageRows = packageStep.rows ?? [];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function PlaygroundExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
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

      // Package orbit: the jars emerge one by one during the second half of
      // chapter 2 passing through the viewport, mirroring the old sticky
      // timing. passThrough is 0 when the chapter's top enters the viewport
      // and 1 when its bottom leaves it.
      const chapter2 = chapterRefs.current[1];
      if (chapter2) {
        const chapter2Rect = chapter2.getBoundingClientRect();
        const passThrough = clamp01(
          (window.innerHeight - chapter2Rect.top) /
            (window.innerHeight + chapter2Rect.height),
        );
        setChapter2Reveal(clamp01((passThrough - 0.5) * 2));
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
            <h2>
              <Image
                className={`${styles.headlineImage} ${styles[`headlineChapter${chapterIndex + 1}`]}`}
                src={sentenceImages[chapterIndex].src}
                alt={chapter.title}
                width={sentenceImages[chapterIndex].width}
                height={sentenceImages[chapterIndex].height}
              />
            </h2>
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

          {chapterIndex === 1 && packageStep.circles && (
            <div
              className={styles.packageOrbit}
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
