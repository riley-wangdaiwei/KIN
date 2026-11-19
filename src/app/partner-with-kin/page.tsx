import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import ArtistContactForm from "@/app/artists/artist-contact-form";
import styles from "@/components/site/site.module.css";

const artistSections = [
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
      "re.KIN brings the meaning; physical gifts add use. We encourage artists to weave connected gifts—like flowers or perfume—into curation.",
      "Florists, bookstores, and other shops can explore mutual storefront promotion and API integration with us.",
    ],
  },
];

export default function PartnerWithKinPage() {
  return (
    <EditorialPage
      eyebrow="PARTNER WITH re.KIN / EARLY CONVERSATIONS"
      title="Bring another kind of meaning."
      intro="re.KIN can complement a partner's existing offer with relationship-led curation. Start with a clear hand-off; build more only when it helps both sides."
      homepageChrome
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>A florist, both ways</h2>
        <div className={styles.sectionBody}>
          <p>
            A partnership can work in either direction without turning two
            distinct businesses into one product.
          </p>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <span className={styles.cardNumber}>DIRECTION / 01</span>
              <h3>Florist → re.KIN</h3>
              <p>
                A florist customer can discover re.KIN after choosing flowers,
                through a checkout message, order confirmation, or follow-up.
                The florist sells and fulfills flowers; re.KIN offers a separate
                digital creative gift.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>DIRECTION / 02</span>
              <h3>re.KIN → florist</h3>
              <p>
                A re.KIN customer can choose flowers as an optional physical
                filling and follow a partner link. The florist handles its
                own stock, checkout, delivery, and returns.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Start at the right scale</h2>
        <div className={styles.sectionBody}>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <span className={styles.cardNumber}>LEVEL 01</span>
              <h3>Referral</h3>
              <p>A simple, clearly described link or recommendation.</p>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>LEVEL 02</span>
              <h3>Widget</h3>
              <p>An embedded entry point with agreed placement and customer hand-off.</p>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>LEVEL 03</span>
              <h3>API</h3>
              <p>A deeper technical connection only when the use case warrants it.</p>
            </article>
          </div>
          <p className={styles.notice}>
            No inventory, checkout, attribution, or API integration is live in
            this preview. Commercial terms, data sharing, service levels, and
            responsibilities require a separate written agreement.
          </p>
          <Link className={styles.cta} href="/contact?topic=partnership">
            Partner with re.KIN →
          </Link>
          <p>For now this opens the contact information page; it does not submit a partnership request.</p>
        </div>
      </section>
      {artistSections.map((section) => (
        <section className={styles.section} key={section.title}>
          <h2 className={styles.sectionHeading}>{section.title}</h2>
          <div className={styles.sectionBody}>
            {section.points.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
        </section>
      ))}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Let&rsquo;s work together.</h2>
        <div className={styles.sectionBody}>
          <ArtistContactForm />
          <p className={styles.notice}>
            If you join, your portfolio can be featured on re.KIN.
          </p>
        </div>
      </section>
    </EditorialPage>
  );
}
