import Link from "next/link";
import homepageStyles from "../homepage.module.css";
import ArtistContactForm from "./artist-contact-form";
import styles from "./page.module.css";

const sections = [
  {
    title: "For artists",
    points: [
      "Join an anthropology-like story and art project through gift curation. Participating artists earn commissions.",
      "License the work you contribute for agreed uses.",
      "Our incentive mechanism encourages clients to interact with artists—and opens a future chance to buy their work.",
    ],
  },
  {
    title: "Corporate gifting",
    points: [
      "Partner with re.KIN to gift employees and clients art-based gifts.",
    ],
  },
  {
    title: "Physical gifts, integrated",
    points: [
      "KIN brings the meaning; physical gifts add use. We encourage artists to weave connected gifts—like flowers or perfume—into curation.",
      "Florists, bookstores, and other shops can explore mutual storefront promotion and API integration with us.",
    ],
  },
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

export default function ArtistsPage() {
  return (
    <>
      <main className={`${styles.page} ${styles.main}`} data-homepage>
        {/* Decorative backdrop scrolls with the page and fades into the black field. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden="true"
          alt=""
          className={styles.tallBackground}
          src="/integrations.jpg"
        />

        <header className={homepageStyles.header}>
          <Link
            aria-label="re.KIN home"
            className={homepageStyles.wordmark}
            href="/"
          >
            re.KIN
          </Link>
          <nav
            aria-label="Main navigation"
            className={homepageStyles.navigation}
          >
            <Link href="/how-it-works">What is Kin</Link>
            <Link href="/gifts">Gift packages</Link>
            <Link href="/artists">For artists and partners</Link>
            <Link href="/my-gifting-identity">My gifting identity</Link>
            <Link
              className={homepageStyles.navigationCta}
              href="/my-gifting-identity#start-a-project"
            >
              Book a curation meeting
            </Link>
          </nav>
        </header>

        <div className={styles.content}>
          {sections.map((section, sectionIndex) => (
            <section
              aria-labelledby={`artists-section-${sectionIndex + 1}`}
              className={styles.section}
              key={section.title}
            >
              {sectionIndex === 0 ? (
                <h1
                  className={styles.sectionTitle}
                  id={`artists-section-${sectionIndex + 1}`}
                >
                  {section.title}
                </h1>
              ) : (
                <h2
                  className={styles.sectionTitle}
                  id={`artists-section-${sectionIndex + 1}`}
                >
                  {section.title}
                </h2>
              )}
              <ul className={styles.points}>
                {section.points.map((point, pointIndex) => (
                  <li className={styles.point} key={point}>
                    <span aria-hidden="true" className={styles.pointNumber}>
                      {String(pointIndex + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.pointText}>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section aria-labelledby="contact-title" className={styles.contact}>
            <h2 className={styles.contactTitle} id="contact-title">
              Let’s work together.
            </h2>
            <ArtistContactForm />
          </section>
        </div>
      </main>

      <div className={styles.footerWrapper}>
        <footer className={`${homepageStyles.footer} ${styles.footer}`}>
          <Link
            aria-label="re.KIN home"
            className={homepageStyles.footerWordmark}
            href="/"
          >
            re.KIN
          </Link>
          <nav
            aria-label="Footer navigation"
            className={homepageStyles.footerLinks}
          >
            {footerLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <span className={homepageStyles.footerNote}>
            © {new Date().getFullYear()} KIN
          </span>
        </footer>
      </div>
    </>
  );
}
