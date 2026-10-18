import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function PartnerWithKinPage() {
  return (
    <EditorialPage
      eyebrow="PARTNER WITH KIN / EARLY CONVERSATIONS"
      title="Bring another kind of meaning."
      intro="KIN can complement a partner's existing offer with relationship-led curation. Start with a clear hand-off; build more only when it helps both sides."
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
              <h3>Florist → KIN</h3>
              <p>
                A florist customer can discover KIN after choosing flowers,
                through a checkout message, order confirmation, or follow-up.
                The florist sells and fulfills flowers; KIN offers a separate
                digital creative gift.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>DIRECTION / 02</span>
              <h3>KIN → florist</h3>
              <p>
                A KIN customer can choose flowers as an optional physical
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
            Partner with KIN →
          </Link>
          <p>For now this opens the contact information page; it does not submit a partnership request.</p>
        </div>
      </section>
    </EditorialPage>
  );
}
