"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./playground.module.css";

const chapters = [
  {
    title: "less generic gifting",
    lines: [
      "Tell us who the gift is for.",
      "Meet an artist who fits them.",
      "Shape their stories into a gift direction.",
      "Choose what the gift becomes.",
    ],
  },
  {
    title: "more oddly specific art about your favorite people",
    lines: [
      "If your friend collects small curiosities → an illustrated cabinet, a poem, and a note about how they see the world.",
      "If two people share a history across places → a paired map, a location postcard, and a message between the two places.",
    ],
  },
  {
    title: "a more personal identity for the way you give",
    lines: [
      "Your way of giving, made personal. After partnering with us and curating many gifts,",
      "you develop your own gifting style: a way of noticing what matters and turning it into something thoughtful.",
      "Once that style takes shape, you can use it to gift new people directly.",
    ],
  },
];

const cutPoints = [0.12, 0.4, 0.65, 0.9, 1];

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

  const activeChapter = progress < cutPoints[0] ? -1 : progress < cutPoints[1] ? 0 : progress < cutPoints[2] ? 1 : progress < cutPoints[3] ? 2 : -1;
  const showEnding = progress >= cutPoints[3];
  const intro = progress < cutPoints[0];
  const sceneText = activeChapter >= 0 ? chapters[activeChapter] : null;
  const chapterProgress = activeChapter === 0
    ? (progress - cutPoints[0]) / (cutPoints[1] - cutPoints[0])
    : activeChapter === 1
      ? (progress - cutPoints[1]) / (cutPoints[2] - cutPoints[1])
      : (progress - cutPoints[2]) / (cutPoints[3] - cutPoints[2]);
  const lineIndex = sceneText ? (reducedMotion ? sceneText.lines.length - 1 : Math.min(sceneText.lines.length - 1, Math.floor(Math.max(0, chapterProgress) * sceneText.lines.length))) : -1;

  return (
    <section className={styles.experience} ref={experienceRef}>
      <div className={styles.sticky}>
        <Link className={styles.logo} href="/" aria-label="re.KIN home">
          <Image src="/rekin-hero/rekin-logo.png" alt="re.KIN" fill priority sizes="140px" />
        </Link>
        <button className={styles.meeting} type="button">book a free curation meeting</button>
        <button className={styles.login} type="button">login</button>
        <nav className={styles.lowerLinks} aria-label="Site information">
          <button type="button">privacy policy</button>
          <button type="button">about</button>
        </nav>

        <div className={`${styles.vase} ${intro ? styles.vaseIntro : ""} ${showEnding ? styles.vaseEnding : ""}`} aria-hidden="true">
          <Image className={styles.still} src="/rekin-hero/part1.jpg" alt="" fill sizes="(max-width: 700px) 75vw, 44vw" priority />
          {!reducedMotion && <video ref={videoRef} className={styles.video} src="/rekin-hero/hero.mp4" poster="/rekin-hero/hero-poster.jpg" muted playsInline preload="metadata" aria-hidden="true" />}
        </div>

        <div className={`${styles.opening} ${intro ? styles.visible : styles.hidden}`} aria-hidden={!intro}>
          <h1><span>less generic gifting,</span><span>more oddly specific art about your favorite people,</span><span>a more personal identity for the way you give.</span></h1>
        </div>

        <div className={`${styles.story} ${sceneText ? styles.visible : styles.hidden}`} aria-live="polite">
          {sceneText && <>
            <h2>{sceneText.title}</h2>
            <p key={`${activeChapter}-${lineIndex}`}>{sceneText.lines.slice(0, lineIndex + 1).slice(-2).join(" ")}</p>
          </>}
        </div>

        <nav className={`${styles.sideNav} ${activeChapter >= 1 || showEnding ? styles.visible : styles.hidden}`} aria-label="Explore KIN">
          <Link href="/artists">artists and partners</Link>
          {(activeChapter >= 2 || showEnding) && <Link href="/my-gifting-identity">my gifting identity</Link>}
        </nav>

        <div className={`${styles.ending} ${showEnding ? styles.visible : styles.hidden}`}>
          <Link href="/my-gifting-identity#start-a-project">Tell us who you have in mind. <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}




