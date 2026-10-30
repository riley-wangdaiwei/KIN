import Link from "next/link";
import styles from "./homepage.module.css";
import StoryCards from "./story-cards";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with Kin" },
  { href: "/impressum", label: "Impressum" },
];

export default function HomePage() {
  return (
    <main className={styles.homePage} data-homepage>
      <div aria-hidden="true" className={styles.homeBackground} />
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link href="/how-it-works">What is Kin</Link>
          <Link href="/gifts">Gift packages</Link>
          <Link href="/artists">For artists and partners</Link>
          <Link href="/my-gifting-identity">My gifting identity</Link>
          <Link className={styles.navigationCta} href="/my-gifting-identity#start-a-project">
            Book a curation meeting
          </Link>
        </nav>
      </header>

      <section className={styles.hero} aria-label="KIN gifting">
        <h1 className={styles.heroTitle}>
          <span>less generic gifting,</span>
          <span>more oddly specific art about your favorite people,</span>
          <span>a more personal identity for the way you give.</span>
        </h1>
      </section>

      <section className={styles.stories} aria-labelledby="stories-title">
        <div className={styles.storiesHeading}>
          <span className={styles.metadata}>KIN / STORIES OF ATTENTION</span>
          <h2 id="stories-title">The Art of Knowing Someone</h2>
        </div>
        <StoryCards />
        <Link className={styles.projectLink} href="/my-gifting-identity#start-a-project">
          start a project <span aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerWordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <nav className={styles.footerLinks} aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <span className={styles.footerNote}>
          © {new Date().getFullYear()} KIN
        </span>
      </footer>
    </main>
  );
}
