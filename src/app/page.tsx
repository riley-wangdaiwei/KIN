import Link from "next/link";
import styles from "./homepage.module.css";
import StoryCards from "./story-cards";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import HoverRingMenu from "@/components/site/HoverRingMenu";
import BookingTrigger from "@/components/site/BookingTrigger";
import { artistPartnerNames, identityExamples } from "@/data/hover-lists";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with re.KIN" },
];

export default function HomePage() {
  return (
    <>
      <PlaygroundChrome overlaysOnly />
      <main className={styles.homePage} data-homepage>
      <div aria-hidden="true" className={styles.homeBackground} />
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link href="/how-it-works">What is re.KIN</Link>
          <Link href="/gifts">Gift packages</Link>
          <HoverRingMenu
            href="/artists"
            items={artistPartnerNames}
            label="artists and partners"
          />
          <HoverRingMenu
            href="/my-gifting-identity"
            items={identityExamples}
            label="My Gifting Identity"
          />
          <BookingTrigger
            className={`${styles.navigationCta} kin-glass-hover`}
          >
            book a free curation meeting
          </BookingTrigger>
        </nav>
      </header>

      <section className={styles.hero} aria-label="re.KIN gifting">
        <h1 className={styles.heroTitle}>
          <span>less generic gifting,</span>
          <span>more oddly specific art about your favorite people,</span>
          <span>a more personal identity for the way you give.</span>
        </h1>
      </section>

      <section className={styles.stories} aria-labelledby="stories-title">
        <div className={styles.storiesHeading}>
          <span className={styles.metadata}>re.KIN / STORIES OF ATTENTION</span>
          <h2 id="stories-title">The Art of Knowing Someone</h2>
        </div>
        <StoryCards />
        <Link className={styles.projectLink} href="/my-gifting-identity">
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
          © {new Date().getFullYear()} re.KIN
        </span>
      </footer>
      </main>
    </>
  );
}
