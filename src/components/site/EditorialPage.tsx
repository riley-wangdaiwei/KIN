import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import styles from "./site.module.css";

export default function EditorialPage({
  children,
  eyebrow,
  title,
  intro,
  heroImage,
  backgroundBehavior = "fixed",
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage?: string;
  /** "fixed" (default): image stays as the backdrop, only text scrolls.
      "scroll": tall image scrolls together with the content. */
  backgroundBehavior?: "fixed" | "scroll";
}) {
  const isFixed = !!heroImage && backgroundBehavior === "fixed";
  return (
    <main
      className={`${styles.page} ${heroImage ? (isFixed ? styles.imagePage : styles.scrollImagePage) : ""}`}
      style={!isFixed && heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
    >
      {isFixed && (
        <div
          aria-hidden="true"
          className={styles.fixedBg}
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
      )}
      <SiteHeader />
      <section className={`${styles.hero} ${heroImage ? styles.imageHero : styles.textHero}`}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.intro}>{intro}</p>
        </div>
      </section>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
