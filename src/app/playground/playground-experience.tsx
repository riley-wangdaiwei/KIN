"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { artistPartnerNames, identityExamples } from "@/data/hover-lists";
import { storage } from "@/lib/storage";
import JarScroll from "@/components/site/JarScroll";
import HoverRingMenu from "@/components/site/HoverRingMenu";
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
  width: 4067,
  height: 1393,
  alt: "Less generic gifting, more oddly specific art about your favorite people, and a more personal identity for the way you give.",
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

export default function PlaygroundExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
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
      const rect = node.getBoundingClientRect();
      const distance = Math.max(1, node.offsetHeight - window.innerHeight);
      const next = Math.min(1, Math.max(0, -rect.top / distance));
      setProgress(next);
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

  const isOpening = progress < 0.1;
  const activeChapter =
    progress < 0.1
      ? -1
      : progress < 0.35
        ? 0
        : progress < 0.6
          ? 1
          : progress < 0.85
            ? 2
            : -1;
  const showEnding = progress >= 0.85;
  const sceneText = activeChapter >= 0 ? chapters[activeChapter] : null;
  const chapterProgress =
    sceneText === null
      ? 0
      : (progress - (0.1 + activeChapter * 0.25)) / 0.25;
  const stepIndex = reducedMotion
    ? sceneText?.steps.length ?? 0
    : Math.min(1, Math.floor(Math.max(0, chapterProgress) * 2));
  const visibleSteps = sceneText
    ? reducedMotion
      ? sceneText.steps
      : [sceneText.steps[stepIndex]]
    : [];
  const packageStep = sceneText?.steps[1];
  const packageProgress = Math.min(1, Math.max(0, (chapterProgress - 0.5) * 2));
  const visiblePackageCount = reducedMotion
    ? packageStep?.rows?.length ?? 0
    : Math.ceil(packageProgress * (packageStep?.rows?.length ?? 0));

  return (
    <section className={styles.experience} ref={experienceRef}>
      <div className={styles.sticky}>
        <div
          className={`${styles.vase} ${isOpening || activeChapter === 0 ? styles.vaseIntro : ""} ${activeChapter === 1 ? styles.vaseChapter2 : ""} ${showEnding ? styles.vaseEnding : ""}`}
          aria-hidden="true"
        >
          <JarScroll progress={progress} reducedMotion={reducedMotion} />
        </div>

        {isOpening ? (
          <div className={`${styles.openingTitles} ${styles.visible}`}>
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
        ) : (
          <div
            className={`${styles.story} ${activeChapter === 1 ? styles.storyChapter2 : ""} ${sceneText ? styles.visible : styles.hidden}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {sceneText && (
              <>
                <h2>
                  <Image
                    className={`${styles.headlineImage} ${styles[`headlineChapter${activeChapter + 1}`]}`}
                    src={sentenceImages[activeChapter].src}
                    alt={sceneText.title}
                    width={sentenceImages[activeChapter].width}
                    height={sentenceImages[activeChapter].height}
                  />
                </h2>
                {sceneText.subtitle && (
                  <p className={styles.chapterSubtitle}>{sceneText.subtitle}</p>
                )}
                <div className={styles.storyContent}>
                  {visibleSteps.map((step, index) => (
                    <div
                      className={styles.storyStep}
                      key={`${activeChapter}-${stepIndex}-${index}`}
                    >
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
              </>
            )}
          </div>
        )}

        {activeChapter === 1 && packageStep?.circles && (
          <div
            className={styles.packageOrbit}
            aria-label="What comes with the gift"
          >
            {packageStep.rows?.map((row, index) => {
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
              label="My Gifting Identity"
              menuSide="left"
            />
          )}
        </nav>

        <div
          className={`${styles.ending} ${showEnding ? styles.visible : styles.hidden}`}
        >
          <Link href="/my-gifting-identity">
            <Image
              src="/rekin-tell-us-white.png"
              alt="Tell us who you have in mind."
              width={3334}
              height={345}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
