import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

const catalogItems = [
  ["Existing works", "Digital work that can be licensed for a defined, personal-use context."],
  ["Commissions", "A clearly scoped, made-to-order piece for one person or relationship."],
  ["Artist-made Meals", "A complete concept with a point of view, format, process, and maker."],
];

const integrationLevels = [
  ["01 / Referral", "A tracked link sends a customer from an artist's storefront to KIN. Start with the simplest hand-off."],
  ["02 / Widget", "An embedded KIN introduction or gift brief entry point sits alongside an artist's own products."],
  ["03 / API", "A deeper connection can exchange agreed product or referral data, only where the use case and privacy terms are clear."],
];

export default function ArtistsPage() {
  return (
    <EditorialPage
      eyebrow="ARTISTS / CREATE WITH KIN"
      title="Make work that belongs to someone."
      intro="KIN is building a catalog for artists to sell existing work, offer commissions, and create artist-led gift experiences—with scope, credit, rights, and payment terms agreed up front."
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Artist catalog</h2>
        <div className={styles.sectionBody}>
          <p>
            The catalog is being assembled. Artist profiles and orderable
            works will appear only after the maker, format, availability,
            price, delivery, and license are confirmed.
          </p>
          <div className={styles.cardGrid}>
            {catalogItems.map(([title, copy], index) => (
              <article className={styles.card} key={title}>
                <span className={styles.cardNumber}>WORK / 0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <Link className={styles.cta} href="/gifts/artist-made-rhemma-meals">
            See artist-made meal concepts →
          </Link>
        </div>
      </section>
      <section className={styles.section} id="artist-interest">
        <h2 className={styles.sectionHeading}>Join KIN</h2>
        <div className={styles.sectionBody}>
          <p>
            Submissions are not yet open. Prepare a short introduction, a few
            examples of your work, proposed format and scope, price range, and
            any rights or fulfillment needs. We will publish a real submission
            route when the artist program is ready.
          </p>
          <Link className={styles.cta} href="/contact?topic=artist">
            Join the artist interest list →
          </Link>
          <p className={styles.notice}>
            This link opens the contact information page; it does not submit
            an application or create an interest-list record.
          </p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Artist-made Meals</h2>
        <div className={styles.sectionBody}>
          <p>
            An artist-made Meal is a complete gift concept shaped by a
            particular creative practice, not a generic template. The current
            catalog entry is a concept preview and is not an active commission.
          </p>
          <Link className={styles.cta} href="/gifts/artist-made-rhemma-meals">
            Explore the concept →
          </Link>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Rights & revenue</h2>
        <div className={styles.sectionBody}>
          <p>
            Artists keep ownership of their work unless a separate agreement
            says otherwise. Every listing must state what is licensed, for
            whom, for how long, and whether reuse is allowed. No listing grants
            unlimited rights by default.
          </p>
          <p>
            Price, artist compensation, platform fees, revisions, cancellation,
            delivery, and support responsibilities will be agreed for each
            offer before it becomes orderable. KIN has not set a standard
            revenue split; no percentage is implied by this preview.
          </p>
          <Link href="/artist-terms">Read the artist terms draft →</Link>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Your storefront</h2>
        <div className={styles.sectionBody}>
          <p>
            Artists can also introduce KIN from their own stores. These
            integration levels are static previews; no referral tracking,
            widget, or API integration is live here.
          </p>
          <div className={styles.cardGrid}>
            {integrationLevels.map(([title, copy]) => (
              <article className={styles.card} key={title}>
                <span className={styles.cardNumber}>STOREFRONT CONNECTION</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <Link className={styles.cta} href="/partner-with-kin">
            Connect your storefront →
          </Link>
        </div>
      </section>
    </EditorialPage>
  );
}
