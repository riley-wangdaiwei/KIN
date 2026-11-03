import type { ReactNode } from "react";
import Link from "next/link";
import homepageStyles from "@/app/homepage.module.css";
import SiteHeader from "./SiteHeader";
import styles from "./site.module.css";

const navigation = [
  { href: "/how-it-works", label: "What is Kin" },
  { href: "/gifts", label: "Gift packages" },
  { href: "/artists", label: "For artists and partners" },
  { href: "/my-gifting-identity", label: "My gifting identity" },
];

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with Kin" },
];

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
      <main
        className={`${styles.page} ${heroImage ? (isFixed ? styles.imagePage : styles.scrollImagePage) : ""}`}
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
        {homepageChrome ? (
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
              {navigation.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link
                className={homepageStyles.navigationCta}
                href="/my-gifting-identity#start-a-project"
              >
                Book a curation meeting
              </Link>
            </nav>
          </header>
        ) : (
          <SiteHeader />
        )}
        <section className={`${styles.hero} ${heroImage ? styles.imageHero : styles.textHero}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.intro}>{intro}</p>
          </div>
        </section>
        <div className={styles.content}>{children}</div>
        {homepageChrome && (
          <footer className={homepageStyles.footer}>
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
        )}
      </main>
    </>
  );
}
