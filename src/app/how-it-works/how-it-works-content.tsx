"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./how-it-works-content.module.css";

const navigation = [
  { href: "/how-it-works", label: "What is Kin" },
  { href: "/gifts", label: "Gift packages" },
  { href: "/artists", label: "For artists and partners" },
  { href: "/my-gifting-identity", label: "My gifting identity" },
];

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with Kin" },
  { href: "/impressum", label: "Impressum" },
];

const steps = [
  {
    number: "01",
    title: "Connect with an artist",
    details: [
      "You tell us who the gift is for",
      "We connect you with an artist who fits them",
      "You talk to the artist directly",
    ],
  },
  {
    number: "02",
    title: "Curate",
    details: [
      "You share the stories only you know about them",
      "You and the artist shape those stories into a gift direction",
      "You choose what the gift becomes",
    ],
  },
  {
    number: "03",
    title: "A digital package",
    details: [
      "A designed digital publication gathers selected memories as the hero gift",
      "Optional digital art or a poem and three shareable keepsake cards can be fillings",
      "It can include selected memories, photos, and artwork you have permission to share",
      "Your personal message becomes a dedication, and the README explains the private link and keepsake PDF",
      "The artist’s process note explains their choices, and you send your friend the private link",
    ],
  },
  {
    number: "04",
    title: "A personal portfolio",
    details: [
      "Every gift builds your personal portfolio",
      "It shows which artists you worked with",
      "It shows your gifting style",
      "We help curate your personal gifting style",
      "You share it and collaborate with more artists",
      "You gift more people in your own style",
      "The loop keeps going",
    ],
  },
];

export default function HowItWorksContent() {
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    steps.map(() => false),
  );

  function toggleCard(index: number) {
    setFlipped((current) =>
      current.map((isFlipped, cardIndex) =>
        cardIndex === index ? !isFlipped : isFlipped,
      ),
    );
  }

  return (
    <>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link
            className={styles.navigationCta}
            href="/my-gifting-identity#start-a-project"
          >
            Book a curation meeting
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>how to become an artist in gifting?</h1>
      </section>

      <section aria-label="The gifting process" className={styles.steps}>
        {steps.map((step, index) => (
          <button
            aria-label={`${step.number} ${step.title}. Flip to read the step.`}
            aria-pressed={flipped[index]}
            className={`${styles.card} ${flipped[index] ? styles.isFlipped : ""}`}
            key={step.number}
            onClick={() => toggleCard(index)}
            type="button"
          >
            <span className={styles.cardInner}>
              <span className={styles.cardFront}>
                <span className={styles.cardNumber}>{step.number}</span>
                <span className={styles.cardTitle}>
                  <em>{step.title}</em>
                </span>
                <span className={styles.hint}>flip to read</span>
              </span>
              <span className={styles.cardBack}>
                <span className={styles.cardNumber}>{step.number}</span>
                <span className={styles.details}>
                  {step.details.map((detail) => (
                    <span className={styles.detailLine} key={detail}>
                      {detail}
                    </span>
                  ))}
                </span>
                <span className={styles.hint}>flip back</span>
              </span>
            </span>
          </button>
        ))}
      </section>

      <div className={styles.ctaWrap}>
        <Link
          className={styles.navigationCta}
          href="/my-gifting-identity#start-a-project"
        >
          book a curation meeting
        </Link>
      </div>

    </>
  );
}

export function HowItWorksFooter() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.footerWordmark} href="/" aria-label="re.KIN home">
        re.KIN
      </Link>
      <nav className={styles.footerLinks} aria-label="Footer navigation">
        {footerLinks.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <span className={styles.footerNote}>© {new Date().getFullYear()} KIN</span>
    </footer>
  );
}
