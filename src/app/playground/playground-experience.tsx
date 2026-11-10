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
  body?: string;
  rows?: { label: string; description: string }[];
};

const chapters: { title: string; steps: StoryStep[] }[] = [
  {
    title: "less generic gifting",
    steps: [
      {
        body: "Collect what they love and what you love over time; when it is time to give, those details have already started shaping the gift.",
      },
      { body: "Meet an artist who fits them." },
    ],
  },
  {
    title: "more oddly specific art about your favorite people",
    steps: [
      {
        rows: [
          {
            label: "Hero gift",
            description: "The main made-for-them artwork or creation.",
          },
          {
            label: "Fillings",
            description: "Small companion works selected to deepen the gift.",
          },
          {
            label: "Personal message",
            description: "Your words, placed where the recipient will find them.",
          },
          {
            label: "README guide",
            description: "A practical note on opening, saving, or using the gift.",
          },
          {
            label: "Artist's process note",
            description: "A brief account of the choices behind the finished work.",
          },
        ],
      },
      {
        rows: [
          { label: "Hero gift", description: twoPlaces.heroGift },
          { label: "Fillings", description: twoPlaces.fillings.join(" ") },
          { label: "Personal message", description: twoPlaces.personalMessage },
          { label: "README guide", description: twoPlaces.readmeGuide.join(" ") },
          {
            label: "Artist's process note",
            description: twoPlaces.artistProcessNote,
          },
        ],
      },
    ],
  },
  {
    title: "a more personal identity for the way you give",
    steps: [
      {
        body: "Partner with re.KIN across several gifts, and develop a way of noticing what matters to each person.",
      },
      {
        body: "Think of it as collaborating with artists to shape your own identity: not just a personal style, but artists you keep coming back to. Once that way of noticing is yours, you can carry it into gifts for people you haven't curated with us yet.",
      },
    ],
  },
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
        const videoProgress = Math.min(1, next / 0.9);
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

  const activeChapter =
    progress < 0.3 ? 0 : progress < 0.6 ? 1 : progress < 0.9 ? 2 : -1;
  const showEnding = progress >= 0.9;
  const sceneText = activeChapter >= 0 ? chapters[activeChapter] : null;
  const chapterProgress =
    sceneText === null
      ? 0
      : (progress - activeChapter * 0.3) / 0.3;
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
          className={`${styles.vase} ${activeChapter === 0 ? styles.vaseIntro : ""} ${showEnding ? styles.vaseEnding : ""}`}
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

        <div
          className={`${styles.story} ${sceneText ? styles.visible : styles.hidden}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {sceneText && (
            <>
              <h1>{sceneText.title}</h1>
              <div className={styles.storyContent}>
                {visibleSteps.map((step, index) => (
                  <div
                    className={styles.storyStep}
                    key={`${activeChapter}-${stepIndex}-${index}`}
                  >
                    {step.body && <p>{step.body}</p>}
                    {step.rows && (
                      <dl className={styles.packageContents}>
                        {step.rows.map((row) => (
                          <div className={styles.packageItem} key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.description}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

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
          <Link
            className="kin-glass-hover"
            href="/my-gifting-identity"
          >
            Tell us who you have in mind.{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
