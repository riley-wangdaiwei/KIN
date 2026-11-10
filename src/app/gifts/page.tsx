import Link from "next/link";
import { giftImagePaths, giftPackages } from "@/data/gifts";
import BookingTrigger from "@/components/site/BookingTrigger";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import homepageStyles from "../homepage.module.css";
import GiftMeals from "./gift-meals";
import styles from "./page.module.css";

const columns: {
  label: string;
  meals: { slug: string; title: string }[];
}[] = [
  {
    label: "re.KIN meals",
    meals: [
      { slug: "conversation-recap", title: "Conversation Recap" },
      { slug: "the-curiosity-cabinet", title: "Curiosity Cabinet" },
      { slug: "two-places-one-sky", title: "Two Places One Sky" },
      { slug: "the-photo-archive", title: "The Photo Archive" },
      { slug: "the-soft-landing-pack", title: "The Soft Landing Pack" },
    ],
  },
  {
    label: "Artist meals",
    meals: [
      { slug: "artist-made-rhemma-meals", title: "Rhema meal" },
      { slug: "supporting-gifts-fillings", title: "Supporting gifts and fillings" },
    ],
  },
];

export default function GiftsPage() {
  const mealColumns = columns.map((column) => ({
    label: column.label,
    meals: column.meals.map(({ slug, title }) => {
      const gift = giftPackages.find((item) => item.slug === slug);
      if (!gift) {
        throw new Error(`Gift package "${slug}" is missing from the catalog.`);
      }

      return {
        gift,
        image: giftImagePaths[slug],
        title,
      };
    }),
  }));

  return (
    <>
      <PlaygroundChrome overlaysOnly />
      <main className={styles.page} data-homepage>
      <header className={homepageStyles.header}>
        <Link className={homepageStyles.wordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <nav className={homepageStyles.navigation} aria-label="Main navigation">
          <Link href="/how-it-works">What is re.KIN</Link>
          <Link href="/gifts">Gift packages</Link>
          <Link href="/artists">For artists and partners</Link>
          <Link href="/my-gifting-identity">My gifting identity</Link>
          <BookingTrigger
            className={`${homepageStyles.navigationCta} kin-glass-hover`}
          >
            book a free curation meeting
          </BookingTrigger>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>You can also pick from our ready made meals.</h1>
      </section>

      <GiftMeals columns={mealColumns} />

      <div className={styles.ctaWrap}>
        <nav className={homepageStyles.navigation} aria-label="Start a project">
          <BookingTrigger
            className={`${homepageStyles.navigationCta} kin-glass-hover`}
          >
            book a free curation meeting
          </BookingTrigger>
        </nav>
      </div>

      <footer className={homepageStyles.footer}>
        <Link
          className={homepageStyles.footerWordmark}
          href="/"
          aria-label="re.KIN home"
        >
          re.KIN
        </Link>
        <nav
          className={homepageStyles.footerLinks}
          aria-label="Footer navigation"
        >
          {[
            { href: "/about", label: "About" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms" },
            { href: "/artist-terms", label: "Artist Terms" },
            { href: "/contact", label: "Contact" },
            { href: "/partner-with-kin", label: "Partner with re.KIN" },
          ].map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <span className={homepageStyles.footerNote}>
          © {new Date().getFullYear()} re.KIN
        </span>
      </footer>
      </main>
    </>
  );
}
