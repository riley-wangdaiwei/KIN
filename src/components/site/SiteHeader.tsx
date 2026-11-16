import Image from "next/image";
import Link from "next/link";
import styles from "./site.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="re.KIN home">
        <Image src="/rekin-logo-transparent.png" alt="" width={2679} height={747} />
      </Link>
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
