"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { giftPackages } from "@/data/gifts";
import { artistPartnerNames, identityExamples } from "@/data/hover-lists";
import HoverRingMenu from "@/components/site/HoverRingMenu";
import styles from "./playground.module.css";

const twoPlaces = giftPackages.find((gift) => gift.slug === "two-places-one-sky");

if (!twoPlaces) {
  throw new Error('The "Two Places, One Sky" gift package is missing.');
}

type StoryStep = {
  body?: string[];
  introduction?: string;
  conclusion?: string;
  rows?: { label: string; description: string | string[] }[];
};

const chapters: { title: string; steps: StoryStep[] }[] = [
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
    steps: [
      {
        body: [
          "Keep a canvas for each person. Her new favorite band. The way he folds receipts. Your own taste, too. When it's time to give, it's all there.",
        ],
      },
      {
        introduction: "For two people who share a history across two places.",
        rows: [
          {
            label: "Hero gift",
            description: twoPlaces.heroGift,
          },
          {
            label: "Fillings",
            description: twoPlaces.fillings,
          },
          {
            label: "Personal message",
            description: twoPlaces.personalMessage,
          },
          {
            label: "README guide",
            description: [
              "Use the included key to find the places, dates, and shared markers.",
              "Download the keepsake edition.",
            ],
          },
          {
            label: "Artist's process note",
            description: twoPlaces.artistProcessNote,
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
        ],
      },
    ],
  },
];

const openingTitles = [
  "less generic gifting",
  "more oddly specific art about your favorite people",
  "a more personal identity for the way you give",
];

export default function PlaygroundExperience() {
  const experienceRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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

      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const videoProgress = Math.min(1, Math.max(0, (next - 0.1) / 0.8));
        const target = videoProgress * Math.max(0, video.duration - 0.05);
        if (Math.abs(video.currentTime - target) > 0.035) video.currentTime = target;
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

  return (
    <section className={styles.experience} ref={experienceRef}>
      <div className={styles.sticky}>
        <div
          className={`${styles.vase} ${isOpening || activeChapter === 0 ? styles.vaseIntro : ""} ${showEnding ? styles.vaseEnding : ""}`}
          aria-hidden="true"
        >
          <Image
            className={styles.still}
            src="/rekin-hero/part1.jpg"
            alt=""
            fill
            sizes="(max-width: 700px) 75vw, 44vw"
            priority
          />
          {!reducedMotion && (
            <video
              ref={videoRef}
              className={styles.video}
              src="/rekin-hero/hero.mp4"
              poster="/rekin-hero/hero-poster.jpg"
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          )}
        </div>

        {isOpening ? (
          <div className={`${styles.openingTitles} ${styles.visible}`}>
            <h1>
              {openingTitles.map((title) => (
                <span key={title}>{title}</span>
              ))}
            </h1>
          </div>
        ) : (
          <div
            className={`${styles.story} ${sceneText ? styles.visible : styles.hidden}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {sceneText && (
              <>
                <h2>{sceneText.title}</h2>
                <div className={styles.storyContent}>
                  {visibleSteps.map((step, index) => (
                    <div
                      className={styles.storyStep}
                      key={`${activeChapter}-${stepIndex}-${index}`}
                    >
                      {step.introduction && (
                        <p className={styles.introduction}>{step.introduction}</p>
                      )}
                      {step.rows && (
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
          {(activeChapter >= 2 || showEnding) && (
            <HoverRingMenu
              href="/my-gifting-identity"
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
            Tell us who you have in mind.
          </Link>
        </div>
      </div>
    </section>
  );
}
