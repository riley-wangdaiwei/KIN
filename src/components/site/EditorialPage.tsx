import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import styles from "./site.module.css";

export default function EditorialPage({
  children,
  eyebrow,
  title,
  intro,
  heroImage,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage?: string;
}) {
  return (
    <main
      className={`${styles.page} ${heroImage ? styles.imagePage : ""}`}
      style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
    >
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
