import Link from "next/link";
import styles from "./site.module.css";

const links = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with KIN" },
];

export default function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerTop}>
        <Link className={styles.footerMark} href="/">KIN</Link>
        <p>Collect what matters. Curate it with care. Give it meaning.</p>
      </div>
      <nav aria-label="Footer navigation" className={styles.footerLinks}>
        {links.map((link) => (
          <Link href={link.href} key={link.href}>{link.label}</Link>
        ))}
        <Link href="/impressum">Impressum</Link>
      </nav>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} KIN</span>
        <span>AN INDEPENDENT CREATIVE GIFTING PROJECT</span>
      </div>
    </footer>
  );
}
