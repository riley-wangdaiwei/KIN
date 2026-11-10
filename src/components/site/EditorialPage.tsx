import type { ReactNode } from "react";
import PlaygroundChrome from "./PlaygroundChrome";
import styles from "./site.module.css";

export default function EditorialPage({
  children,
  eyebrow,
  title,
  intro,
  heroImage,
  backgroundBehavior = "fixed",
  homepageChrome = false,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage?: string;
  homepageChrome?: boolean;
  /** "fixed" (default): image stays as the backdrop, only text scrolls.
      "scroll": tall image scrolls together with the content. */
  backgroundBehavior?: "fixed" | "scroll";
}) {
  const isFixed = !!heroImage && backgroundBehavior === "fixed";
  return (
    <>
      {homepageChrome && <PlaygroundChrome />}
      <main
        className={`${styles.page} ${homepageChrome ? styles.playgroundPage : ""} ${heroImage ? (isFixed ? styles.imagePage : styles.scrollImagePage) : ""}`}
        data-homepage={homepageChrome ? "true" : undefined}
      >
        {isFixed && (
          <div
            aria-hidden="true"
            className={styles.fixedBg}
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
        )}
        {!isFixed && heroImage && (
          // Decorative backdrop: plain <img> keeps natural aspect ratio for the fade-out mask.
          // eslint-disable-next-line @next/next/no-img-element
          <img aria-hidden="true" alt="" src={heroImage} className={styles.tallBg} />
        )}
        <section className={`${styles.hero} ${heroImage ? styles.imageHero : styles.textHero}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.intro}>{intro}</p>
          </div>
        </section>
        <div className={styles.content}>{children}</div>
      </main>
    </>
  );
}
