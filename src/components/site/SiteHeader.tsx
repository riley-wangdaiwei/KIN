import Link from "next/link";
import styles from "./site.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="KIN home">KIN</Link>
      <nav aria-label="Main navigation">
        <Link href="/how-it-works">HOW IT WORKS</Link>
        <Link href="/gifts">GIFTS</Link>
        <Link href="/artists">ARTISTS</Link>
        <Link href="/integrations">INTEGRATIONS</Link>
        <Link href="/community">COMMUNITY</Link>
      </nav>
    </header>
  );
}
