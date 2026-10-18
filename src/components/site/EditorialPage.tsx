import type { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import styles from "./site.module.css";

export default function EditorialPage({
  children,
  eyebrow,
  title,
  intro,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </section>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
